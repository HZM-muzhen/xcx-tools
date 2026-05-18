<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { summarize, type SummaryResult } from '@/utils/voiceSummarizer'

const historyStore = useHistoryStore()
const state = ref<'idle' | 'recording' | 'recorded'>('idle')
const duration = ref(0)
const audioPath = ref('')
const transcribedText = ref('')
const summary = ref<SummaryResult | null>(null)
const isRecognizing = ref(false)
const marks = ref<number[]>([])
const isPaused = ref(false)

let timer: ReturnType<typeof setInterval> | null = null
let recorder: ReturnType<typeof uni.getRecorderManager> | null = null

function initRecorder() {
  // #ifdef MP-WEIXIN
  recorder = uni.getRecorderManager()
  recorder.onStart(() => {
    state.value = 'recording'
    duration.value = 0
    marks.value = []
    isPaused.value = false
    timer = setInterval(() => { duration.value++ }, 1000)
  })
  recorder.onStop((res) => {
    if (timer) { clearInterval(timer); timer = null }
    audioPath.value = res.tempFilePath
    state.value = 'recorded'
    tryRecognize()
  })
  recorder.onError(() => {
    if (timer) { clearInterval(timer); timer = null }
    state.value = 'idle'
    uni.showToast({ title: '录音失败', icon: 'none' })
  })
  // #endif
}

function toggleRecord() {
  if (state.value === 'recording') {
    recorder?.stop()
  } else if (state.value === 'idle') {
    if (!recorder) initRecorder()
    recorder?.start({ format: 'mp3', duration: 600000 })
  }
}

function togglePause() {
  if (!recorder) return
  // #ifdef MP-WEIXIN
  if (isPaused.value) {
    (recorder as any).resume()
    isPaused.value = false
    timer = setInterval(() => { duration.value++ }, 1000)
  } else {
    (recorder as any).pause()
    isPaused.value = true
    if (timer) { clearInterval(timer); timer = null }
  }
  // #endif
}

function addMark() {
  marks.value.push(duration.value)
  uni.showToast({ title: '已标记 ' + fmt(duration.value), icon: 'none', duration: 1000 })
}

async function tryRecognize() {
  isRecognizing.value = true
  try {
    // #ifdef MP-WEIXIN
    const envId = uni.getStorageSync('cloudEnvId')
    if (envId) {
      const upload = await (wx as any).cloud.uploadFile({
        cloudPath: 'voice/' + Date.now() + '.mp3',
        filePath: audioPath.value,
      })
      const res = await (wx as any).cloud.callFunction({
        name: 'voice',
        data: { filePath: upload.fileID },
      })
      if (res.result?.text) {
        transcribedText.value = res.result.text
        runSummary()
        uni.showToast({ title: '识别完成', icon: 'success' })
        isRecognizing.value = false
        return
      }
    }
    // #endif
  } catch { /* fallback */ }
  isRecognizing.value = false
}

function runSummary() {
  if (transcribedText.value.trim()) summary.value = summarize(transcribedText.value)
  else summary.value = null
}

function playAudio() {
  if (!audioPath.value) return
  const a = uni.createInnerAudioContext(); a.src = audioPath.value; a.play()
}

function saveNote() {
  if (!transcribedText.value.trim()) { uni.showToast({ title: '暂无内容可保存', icon: 'none' }); return }
  if (!summary.value) runSummary()
  const r = summary.value
  if (!r) return
  historyStore.addEntry({
    id: Date.now().toString(), toolId: 'voice-notes', type: 'voice',
    title: r.title, summary: r.points[0]?.text.slice(0, 100) || '',
    data: { audioPath: audioPath.value, points: r.points, date: r.date, rawText: transcribedText.value, duration: duration.value, marks: marks.value },
    createdAt: Date.now(), favorited: false,
  })
  uni.showToast({ title: '已保存', icon: 'success' })
  setTimeout(() => uni.navigateBack(), 800)
}

function copyText() {
  if (!summary.value) return
  let text = `${summary.value.title}\n${summary.value.date}\n\n`
  for (const p of summary.value.points) {
    const icon = p.category === 'action' ? '▸' : p.category === 'key' ? '●' : '·'
    text += `${icon} ${p.text}\n`
  }
  uni.setClipboardData({ data: text })
  uni.showToast({ title: '已复制', icon: 'success' })
}

function resetAll() {
  state.value = 'idle'; duration.value = 0; audioPath.value = ''
  transcribedText.value = ''; summary.value = null; marks.value = []
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60); const s = sec % 60
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0')
}

const iconMap: Record<string, string> = { key: '🔵', info: '⚪', action: '🟠' }

onUnmounted(() => { if (timer) clearInterval(timer); recorder?.stop() })
</script>

<template>
  <view class="page">
    <!-- ===== IDLE ===== -->
    <view v-if="state === 'idle'" class="idle-state">
      <view class="idle-icon">🎙️</view>
      <text class="idle-title">语音记录</text>
      <text class="idle-desc">点击按钮开始录音，自动转文字并总结要点</text>
      <view class="idle-btn" @tap="toggleRecord">
        <text class="idle-btn-icon">🎙️</text>
      </view>
      <text class="idle-hint">点击开始录音</text>
    </view>

    <!-- ===== RECORDING ===== -->
    <view v-if="state === 'recording'" class="recording-state">
      <view class="wave-area">
        <view v-for="i in 31" :key="i" class="wave-bar"
          :style="{ height: (25 + Math.sin(i * 0.5 + duration * 0.3) * 18 + (i % 3) * 12) + 'rpx' }" />
      </view>

      <text class="recording-timer">{{ fmt(duration) }}</text>
      <text class="recording-hint">正在录音...</text>

      <view v-if="marks.length > 0" class="marks-area">
        <text class="marks-title">已标记 {{ marks.length }} 个重点</text>
        <view class="marks-list">
          <text v-for="(m, i) in marks" :key="i" class="mark-item">{{ fmt(m) }}</text>
        </view>
      </view>

      <view class="recording-controls">
        <view class="ctrl-btn ctrl-mark" @tap="addMark">
          <text class="ctrl-icon">📍</text>
          <text class="ctrl-label">标记</text>
        </view>
        <view class="ctrl-btn ctrl-stop" @tap="toggleRecord">
          <view class="stop-icon" />
        </view>
        <view class="ctrl-btn" @tap="togglePause">
          <text class="ctrl-icon">{{ isPaused ? '▶️' : '⏸️' }}</text>
          <text class="ctrl-label">{{ isPaused ? '继续' : '暂停' }}</text>
        </view>
      </view>
    </view>

    <!-- ===== RESULT ===== -->
    <view v-if="state === 'recorded'" class="result-state">
      <view class="result-header">
        <text class="result-title">{{ summary?.title || '语音记录' }}</text>
        <view class="result-meta">
          <text class="result-duration">⏱ 时长 {{ fmt(duration) }}</text>
          <text v-if="audioPath" class="result-play" @tap="playAudio">▶️ 回听</text>
        </view>
      </view>

      <view v-if="isRecognizing" class="recognizing-bar">
        <text>🔉 正在识别语音...</text>
      </view>

      <view class="result-body">
        <view class="edit-section">
          <view class="edit-header">
            <text class="edit-label">📝 转写内容</text>
            <text class="edit-hint">可编辑修改</text>
          </view>
          <textarea class="edit-textarea" v-model="transcribedText" placeholder="语音识别结果会显示在这里，也可手动输入..." @blur="runSummary" />
        </view>

        <view v-if="transcribedText.trim() && !summary" class="summarize-bar" @tap="runSummary">
          <text>✨ 生成要点总结</text>
        </view>

        <view v-if="summary" class="summary-card">
          <text class="summary-title">📋 要点总结</text>
          <view class="summary-points">
            <view v-for="(p, i) in summary.points" :key="i" class="sp">
              <text class="sp-icon">{{ iconMap[p.category] || '⚪' }}</text>
              <text class="sp-text">{{ p.text }}</text>
            </view>
          </view>
        </view>

        <view v-if="marks.length > 0" class="marks-card">
          <text class="marks-title-sm">📍 标记时刻</text>
          <view class="marks-row">
            <text v-for="(m, i) in marks" :key="i" class="mark-chip">{{ fmt(m) }}</text>
          </view>
        </view>
      </view>

      <view class="bottom-bar">
        <view class="bbtn bbtn--outline" @tap="resetAll">
          <text>🔄 重新录音</text>
        </view>
        <view class="bbtn bbtn--outline" @tap="copyText">
          <text>📋 复制</text>
        </view>
        <view class="bbtn bbtn--primary" @tap="saveNote">
          <text>💾 保存记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

.idle-state { display: flex; flex-direction: column; align-items: center; padding-top: 140rpx; }
.idle-icon { font-size: 80rpx; margin-bottom: 32rpx; }
.idle-title { font-size: 40rpx; font-weight: 700; color: #1A1A1A; margin-bottom: 16rpx; }
.idle-desc { font-size: 26rpx; color: #999; text-align: center; padding: 0 80rpx; line-height: 1.6; margin-bottom: 80rpx; }
.idle-btn { width: 160rpx; height: 160rpx; border-radius: 50%; background: linear-gradient(135deg, #FF6B6B, #E05555); box-shadow: 0 8rpx 32rpx rgba(224,85,85,0.35); display: flex; align-items: center; justify-content: center; }
.idle-btn-icon { font-size: 60rpx; }
.idle-hint { font-size: 26rpx; color: #999; margin-top: 32rpx; }

.recording-state { min-height: 100vh; background: linear-gradient(180deg, #1A1A2E 0%, #16213E 100%); display: flex; flex-direction: column; align-items: center; padding-top: 60rpx; }

.wave-area { display: flex; align-items: center; justify-content: center; gap: 8rpx; height: 240rpx; padding: 0 40rpx; }
.wave-bar { width: 8rpx; background: rgba(74,144,217,0.6); border-radius: 4rpx; }

.recording-timer { font-size: 80rpx; font-weight: 200; color: #fff; font-variant-numeric: tabular-nums; margin-top: 20rpx; letter-spacing: 8rpx; }
.recording-hint { font-size: 26rpx; color: rgba(255,255,255,0.5); margin-top: 16rpx; }

.marks-area { width: 600rpx; margin-top: 24rpx; padding: 24rpx; background: rgba(255,255,255,0.08); border-radius: 16rpx; }
.marks-title { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 12rpx; }
.marks-list { display: flex; flex-wrap: wrap; gap: 12rpx; }
.mark-item { font-size: 22rpx; color: #FFD93D; background: rgba(255,217,61,0.15); padding: 6rpx 16rpx; border-radius: 999rpx; }

.recording-controls { display: flex; align-items: center; justify-content: center; gap: 80rpx; position: fixed; bottom: 80rpx; left: 0; right: 0; }
.ctrl-btn { display: flex; flex-direction: column; align-items: center; gap: 8rpx; }
.ctrl-icon { font-size: 40rpx; }
.ctrl-label { font-size: 22rpx; color: rgba(255,255,255,0.6); }
.ctrl-stop { width: 100rpx; height: 100rpx; border-radius: 50%; background: #E05555; display: flex; align-items: center; justify-content: center; box-shadow: 0 4rpx 20rpx rgba(224,85,85,0.5); }
.stop-icon { width: 28rpx; height: 28rpx; border-radius: 6rpx; background: #fff; }

.result-state { min-height: 100vh; padding-bottom: 160rpx; }
.result-header { background: #fff; padding: 32rpx 24rpx; border-bottom: 1rpx solid #F2F4F6; }
.result-title { font-size: 36rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 12rpx; }
.result-meta { display: flex; align-items: center; justify-content: space-between; }
.result-duration { font-size: 24rpx; color: #999; }
.result-play { font-size: 24rpx; color: #4A90D9; }

.recognizing-bar { margin: 24rpx; padding: 20rpx; background: rgba(74,144,217,0.08); border-radius: 12rpx; text-align: center; }
.recognizing-bar text { font-size: 26rpx; color: #4A90D9; }

.result-body { padding: 24rpx; }
.edit-section { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.edit-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; }
.edit-hint { font-size: 22rpx; color: #ccc; }
.edit-textarea { width: 100%; min-height: 200rpx; font-size: 26rpx; color: #1A1A1A; line-height: 1.8; background: #F9FAFB; border-radius: 8rpx; padding: 16rpx; box-sizing: border-box; }

.summarize-bar { background: linear-gradient(135deg, #4A90D9, #3A7BD5); border-radius: 16rpx; padding: 24rpx; text-align: center; margin-bottom: 20rpx; box-shadow: 0 4rpx 16rpx rgba(74,144,217,0.25); }
.summarize-bar text { color: #fff; font-size: 28rpx; font-weight: 600; }

.summary-card { background: #fff; border-radius: 16rpx; padding: 28rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.summary-title { font-size: 28rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 20rpx; }
.sp { display: flex; align-items: flex-start; margin-bottom: 16rpx; padding-bottom: 16rpx; border-bottom: 1rpx solid #F5F5F5; }
.sp:last-child { border-bottom: 0; margin-bottom: 0; }
.sp-icon { font-size: 24rpx; margin-right: 12rpx; flex-shrink: 0; margin-top: 2rpx; }
.sp-text { font-size: 28rpx; color: #333; line-height: 1.6; }

.marks-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.marks-title-sm { font-size: 24rpx; color: #999; display: block; margin-bottom: 12rpx; }
.marks-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.mark-chip { font-size: 24rpx; color: #F0A040; background: rgba(240,160,64,0.1); padding: 8rpx 20rpx; border-radius: 999rpx; }

.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; gap: 16rpx; padding: 20rpx 24rpx; padding-bottom: 40rpx; background: #fff; border-top: 1rpx solid #F2F4F6; }
.bbtn { flex: 1; padding: 20rpx 0; border-radius: 999rpx; text-align: center; }
.bbtn text { font-size: 26rpx; font-weight: 600; }
.bbtn--outline { background: #F5F7FA; }
.bbtn--outline text { color: #5A5A5A; }
.bbtn--primary { background: #4A90D9; }
.bbtn--primary text { color: #fff; }
</style>
