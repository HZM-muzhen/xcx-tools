<script setup lang="ts">
import { ref, computed } from 'vue'

// ===== 数据模型 =====
interface Record {
  id: string
  date: string
  time: string
  content: string
  status: 'completed' | 'in_progress' | 'issue' | 'meeting'
}

const STATUS_LABELS: Record<string, string> = { completed: '已完成', in_progress: '进行中', issue: '问题', meeting: '会议' }
const STATUS_ICONS: Record<string, string> = { completed: '✅', in_progress: '⏳', issue: '❗', meeting: '📅' }
const WEEKLY_TARGET = 20

// ===== 状态 =====
const records = ref<Record[]>([])
const inputText = ref('')
const inputStatus = ref<Record['status']>('in_progress')
const showReport = ref(false)
const showAll = ref(false)
const reportText = ref('')

// ===== 初始化加载数据 =====
function loadRecords() {
  try {
    const raw = uni.getStorageSync('memoBox_records')
    records.value = raw ? JSON.parse(raw) : []
  } catch { records.value = [] }
}
loadRecords()

function saveRecords() {
  uni.setStorageSync('memoBox_records', JSON.stringify(records.value))
}

// ===== 日期工具 =====
function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowTime(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// 本周一（ISO 周，周一为起始）
function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const m = new Date(d)
  m.setDate(d.getDate() + diff)
  m.setHours(0, 0, 0, 0)
  return m
}

// 本周五
function getFriday(monday: Date): Date {
  const f = new Date(monday)
  f.setDate(monday.getDate() + 4)
  return f
}

const today = todayStr()
const monday = getMonday(new Date())
const friday = getFriday(monday)
const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
const weekEnd = `${friday.getFullYear()}-${String(friday.getMonth() + 1).padStart(2, '0')}-${String(friday.getDate()).padStart(2, '0')}`

function daysUntilFriday(): number {
  const now = new Date()
  const fri = friday
  const diff = Math.ceil((fri.getTime() - now.getTime()) / 86400000)
  return Math.max(diff, 0)
}

// ===== 计算属性 =====
const weekRecords = computed(() =>
  records.value.filter(r => r.date >= weekStart && r.date <= weekEnd)
)
const todayRecords = computed(() =>
  records.value.filter(r => r.date === today).sort((a, b) => b.time.localeCompare(a.time))
)
const weekCount = computed(() => weekRecords.value.length)
const progress = computed(() => Math.min(weekCount.value / WEEKLY_TARGET, 1))
const remaining = computed(() => Math.max(WEEKLY_TARGET - weekCount.value, 0))

const lastRecord = computed(() => {
  if (records.value.length === 0) return '暂无'
  const r = records.value[records.value.length - 1]
  return `${r.date} ${r.time}`
})

const charCount = computed(() => inputText.value.length)
const overLimit = computed(() => charCount.value > 200)

// ===== 记录操作 =====
function addRecord() {
  if (!inputText.value.trim() || overLimit.value) return
  records.value.push({
    id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
    date: today,
    time: nowTime(),
    content: inputText.value.trim(),
    status: inputStatus.value,
  })
  saveRecords()
  inputText.value = ''
}

function deleteRecord(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复',
    success: (res: any) => {
      if (res.confirm) {
        records.value = records.value.filter(r => r.id !== id)
        saveRecords()
      }
    },
  })
}

// ===== 周报生成 =====
function generateReport() {
  const wk = weekRecords.value
  if (wk.length === 0) {
    reportText.value = '本周暂无记录'
    showReport.value = true
    return
  }
  // 按日期分组
  const groups: Record<string, Record[]> = {}
  for (const r of wk) {
    if (!groups[r.date]) groups[r.date] = []
    groups[r.date].push(r)
  }
  const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a))

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  let text = `# 周报（${weekStart} 至 ${weekEnd}）\n\n`
  for (const date of sortedDates) {
    const d = new Date(date)
    const month = d.getMonth() + 1
    const day = d.getDate()
    const wd = weekdays[d.getDay()]
    text += `## ${month}月${day}日 周${wd}\n`
    for (const r of groups[date]) {
      text += `- ${r.time} [${STATUS_LABELS[r.status]}] ${r.content}\n`
    }
    text += '\n'
  }
  text += `---\n共 ${wk.length} 条记录，目标 ${WEEKLY_TARGET} 条，完成度 ${Math.round(progress.value * 100)}%`
  reportText.value = text
  showReport.value = true
}

function copyReport() {
  uni.setClipboardData({ data: reportText.value })
  uni.showToast({ title: '周报已复制', icon: 'success' })
}

// ===== 格式化 =====
function fmtDate(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <view class="page">
    <!-- ===== 头部 ===== -->
    <view class="header">
      <text class="header-title">📝 周记匣 MemoBox</text>
      <text class="header-sub">每天记一记，周五一键生成周报</text>
    </view>

    <!-- ===== 统计卡片 ===== -->
    <view class="stats-card">
      <view class="stats-row">
        <view class="stat">
          <text class="stat-num">{{ weekCount }}</text>
          <text class="stat-label">本周已记录</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ daysUntilFriday() }}</text>
          <text class="stat-label">距周五天数</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ remaining }}</text>
          <text class="stat-label">还差条数</text>
        </view>
      </view>

      <!-- 进度条 -->
      <view class="progress-wrap">
        <view class="progress-bar" :style="{ width: (progress * 100) + '%' }" />
      </view>
      <view class="progress-info">
        <text>完成度 {{ Math.round(progress * 100) }}%</text>
        <text v-if="remaining === 0">🎉 已达标</text>
        <text v-else>目标 {{ WEEKLY_TARGET }} 条</text>
      </view>

      <text class="last-record">上次记录：{{ lastRecord }}</text>
    </view>

    <!-- ===== 快速记录 ===== -->
    <view class="input-card">
      <textarea
        class="input-area"
        v-model="inputText"
        :maxlength="200"
        placeholder="做完什么了？随手记一下..."
        :auto-height="true"
      />
      <view class="input-footer">
        <text class="char-count" :class="{ over: overLimit }">{{ charCount }}/200</text>
        <view class="status-tags">
          <text v-for="(label, key) in STATUS_LABELS" :key="key"
            class="stag" :class="{ active: inputStatus === key }"
            @tap="inputStatus = key as Record['status']">
            {{ STATUS_ICONS[key] }} {{ label }}
          </text>
        </view>
      </view>
      <view
        class="add-btn"
        :class="{ disabled: !inputText.trim() || overLimit }"
        @tap="addRecord">
        <text>记录</text>
      </view>
      <text v-if="overLimit" class="over-hint">⚠️ 字数已超出200字限制</text>
    </view>

    <!-- ===== 今日记录 ===== -->
    <view class="today-card">
      <view class="today-header">
        <text class="today-title">今天已记录</text>
        <text class="today-link" @tap="showAll = true">查看全部 →</text>
      </view>
      <text class="today-date">{{ fmtDate(today) }}</text>

      <view v-if="todayRecords.length === 0" class="empty-hint">
        <text>今天还没有记录，写一句就开始积累。</text>
      </view>

      <view v-for="r in todayRecords" :key="r.id" class="record-item">
        <view class="record-left">
          <text class="record-status">{{ STATUS_ICONS[r.status] }} {{ STATUS_LABELS[r.status] }}</text>
          <text class="record-content">{{ r.content }}</text>
        </view>
        <view class="record-right">
          <text class="record-time">{{ r.time }}</text>
          <text class="record-del" @tap="deleteRecord(r.id)">🗑️</text>
        </view>
      </view>
    </view>

    <!-- ===== 底部按钮 ===== -->
    <view class="bottom-bar" @tap="generateReport">
      <text class="bottom-text">📋 生成周报</text>
    </view>

    <!-- ===== 查看全部弹窗 ===== -->
    <view v-if="showAll" class="modal-mask" @tap="showAll = false">
      <view class="modal-card" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">本周所有记录</text>
          <text class="modal-close" @tap="showAll = false">✕</text>
        </view>
        <scroll-view scroll-y class="modal-body">
          <view v-if="weekRecords.length === 0" class="empty-hint">
            <text>本周暂无记录</text>
          </view>
          <view v-for="r in weekRecords.slice().reverse()" :key="r.id" class="record-item">
            <view class="record-left">
              <text class="record-date">{{ r.date }}</text>
              <text class="record-status">{{ STATUS_ICONS[r.status] }} {{ r.content }}</text>
            </view>
            <text class="record-time">{{ r.time }}</text>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- ===== 周报弹窗 ===== -->
    <view v-if="showReport" class="modal-mask" @tap="showReport = false">
      <view class="modal-card report-card" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">📋 周报预览</text>
          <text class="modal-close" @tap="showReport = false">✕</text>
        </view>
        <scroll-view scroll-y class="report-body">
          <text class="report-text">{{ reportText }}</text>
        </scroll-view>
        <view class="report-actions">
          <view class="ract ract--copy" @tap="copyReport">
            <text>📋 复制文本</text>
          </view>
          <view class="ract ract--close" @tap="showReport = false">
            <text>关闭</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部安全距离 -->
    <view style="height: 160rpx;" />
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

/* ===== Header ===== */
.header { padding: 32rpx 24rpx 24rpx; }
.header-title { font-size: 40rpx; font-weight: 800; color: #1A1A1A; display: block; margin-bottom: 8rpx; }
.header-sub { font-size: 24rpx; color: #999; display: block; }

/* ===== Stats Card ===== */
.stats-card { margin: 0 24rpx 20rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.stats-row { display: flex; justify-content: space-around; margin-bottom: 24rpx; }
.stat { text-align: center; }
.stat-num { font-size: 44rpx; font-weight: 700; color: #4A90D9; display: block; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }

.progress-wrap { height: 12rpx; background: #EDF1F5; border-radius: 6rpx; overflow: hidden; margin-bottom: 12rpx; }
.progress-bar { height: 12rpx; background: linear-gradient(90deg, #4A90D9, #3A7BD5); border-radius: 6rpx; transition: width 0.3s; }

.progress-info { display: flex; justify-content: space-between; font-size: 22rpx; color: #999; margin-bottom: 12rpx; }
.last-record { font-size: 22rpx; color: #bbb; display: block; }

/* ===== Input Card ===== */
.input-card { margin: 0 24rpx 20rpx; background: #fff; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.input-area { width: 100%; min-height: 120rpx; font-size: 28rpx; color: #1A1A1A; background: #F9FAFB; border-radius: 12rpx; padding: 20rpx; box-sizing: border-box; }

.input-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16rpx; }
.char-count { font-size: 22rpx; color: #bbb; }
.over { color: #E05555; font-weight: 600; }

.status-tags { display: flex; gap: 8rpx; }
.stag { font-size: 22rpx; padding: 8rpx 16rpx; border-radius: 999rpx; background: #EDF1F5; color: #999; white-space: nowrap; }
.active { background: #4A90D9; color: #fff; }

.add-btn { background: #4A90D9; border-radius: 12rpx; padding: 18rpx; text-align: center; margin-top: 16rpx; }
.add-btn text { color: #fff; font-size: 28rpx; font-weight: 600; }
.disabled { background: #ccc; }

.over-hint { font-size: 22rpx; color: #E05555; margin-top: 8rpx; text-align: center; display: block; }

/* ===== Today Card ===== */
.today-card { margin: 0 24rpx 20rpx; background: #fff; border-radius: 20rpx; padding: 28rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.today-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.today-title { font-size: 30rpx; font-weight: 700; color: #1A1A1A; }
.today-link { font-size: 24rpx; color: #4A90D9; }
.today-date { font-size: 24rpx; color: #bbb; display: block; margin-bottom: 20rpx; }

.empty-hint { text-align: center; padding: 48rpx 0; }
.empty-hint text { font-size: 26rpx; color: #ccc; }

.record-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.record-item:last-child { border-bottom: 0; }
.record-left { flex: 1; overflow: hidden; }
.record-status { font-size: 22rpx; color: #999; display: block; margin-bottom: 6rpx; }
.record-content { font-size: 28rpx; color: #1A1A1A; line-height: 1.5; display: block; }
.record-date { font-size: 22rpx; color: #bbb; display: block; margin-bottom: 4rpx; }
.record-right { display: flex; flex-direction: column; align-items: flex-end; margin-left: 16rpx; flex-shrink: 0; }
.record-time { font-size: 22rpx; color: #ccc; }
.record-del { font-size: 28rpx; margin-top: 8rpx; }

/* ===== Bottom Bar ===== */
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 20rpx 24rpx 44rpx; background: #fff; border-top: 1rpx solid #F2F4F6; text-align: center; }
.bottom-text { font-size: 30rpx; font-weight: 700; color: #4A90D9; }

/* ===== Modal ===== */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 100; display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-height: 80vh; background: #fff; border-radius: 28rpx 28rpx 0 0; overflow: hidden; }
.report-card { max-height: 90vh; }

.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 28rpx 28rpx 20rpx; border-bottom: 1rpx solid #F2F4F6; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #1A1A1A; }
.modal-close { font-size: 36rpx; color: #ccc; padding: 0 8rpx; }

.modal-body { max-height: 60vh; padding: 16rpx 28rpx; }

.report-body { max-height: 55vh; padding: 24rpx 28rpx; }
.report-text { font-size: 26rpx; color: #333; line-height: 1.8; white-space: pre-wrap; font-family: monospace; display: block; }

.report-actions { display: flex; gap: 16rpx; padding: 20rpx 28rpx 40rpx; border-top: 1rpx solid #F2F4F6; }
.ract { flex: 1; padding: 18rpx; border-radius: 999rpx; text-align: center; }
.ract text { font-size: 26rpx; font-weight: 600; }
.ract--copy { background: #4A90D9; }
.ract--copy text { color: #fff; }
.ract--close { background: #F5F7FA; }
.ract--close text { color: #999; }
</style>
