<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useHistoryStore } from '@/stores/history'

const historyStore = useHistoryStore()
const entryId = ref('')
const entry = computed(() => historyStore.getEntry(entryId.value))
const points = ref<{ text: string; category: string }[]>([])

onLoad((query: any) => {
  entryId.value = query?.id || ''
  const data = entry.value?.data
  if (data?.points) points.value = JSON.parse(JSON.stringify(data.points))
})

function saveEdits() {
  if (!entry.value) return
  entry.value.data.points = JSON.parse(JSON.stringify(points.value))
  uni.showToast({ title: '已保存', icon: 'success' })
}

function copyAll() {
  if (!entry.value) return
  let text = `${entry.value.title}\n${entry.value.data.date || ''}\n\n`
  for (const p of points.value) {
    const icon = p.category === 'action' ? '▸' : p.category === 'key' ? '●' : '·'
    text += `${icon} ${p.text}\n`
  }
  uni.setClipboardData({ data: text })
  uni.showToast({ title: '已复制', icon: 'success' })
}

function deleteNote() {
  uni.showModal({
    title: '确认删除',
    success: (res: any) => { if (res.confirm) { historyStore.removeEntry(entryId.value); uni.showToast({ title: '已删除', icon: 'success' }); setTimeout(() => uni.navigateBack(), 800) } },
  })
}

function playAudio() {
  const path = entry.value?.data?.audioPath
  if (!path) return
  const a = uni.createInnerAudioContext(); a.src = path; a.play()
}

function toggleFav() {
  if (!entry.value) return
  historyStore.toggleFavorite(entryId.value)
}

const iconMap: Record<string, string> = { key: '🔵', info: '⚪', action: '🟠' }
</script>

<template>
  <view v-if="entry" class="page">
    <view class="header">
      <text class="title">{{ entry.title }}</text>
      <text class="date">{{ entry.data.date }}</text>
      <view class="meta">
        <text v-if="entry.data.duration">时长: {{ Math.floor(entry.data.duration / 60) }}分{{ entry.data.duration % 60 }}秒</text>
        <view class="meta-actions">
          <text v-if="entry.data.audioPath" class="link" @tap="playAudio">▶️ 回听</text>
          <text class="link" @tap="toggleFav">{{ entry.favorited ? '⭐' : '☆' }} 收藏</text>
        </view>
      </view>
    </view>

    <view class="body">
      <view v-for="(p, i) in points" :key="i" class="point">
        <text class="point-icon">{{ iconMap[p.category] || '⚪' }}</text>
        <textarea class="point-text" v-model="points[i].text" :auto-height="true" />
      </view>
    </view>

    <view class="actions">
      <view class="act act--danger" @tap="deleteNote"><text>删除</text></view>
      <view class="act act--secondary" @tap="copyAll"><text>复制全部</text></view>
      <view class="act act--primary" @tap="saveEdits"><text>保存修改</text></view>
    </view>
  </view>
  <view v-else class="empty"><text>记录不存在</text></view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.header { background: #fff; padding: 32rpx 24rpx; border-bottom: 1rpx solid #F2F4F6; }
.title { font-size: 44rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 8rpx; }
.date { font-size: 26rpx; color: #999; display: block; margin-bottom: 16rpx; }
.meta { display: flex; align-items: center; justify-content: space-between; font-size: 22rpx; color: #999; }
.meta-actions { display: flex; gap: 24rpx; }
.link { color: #4A90D9; }

.body { padding: 24rpx; }
.point { display: flex; align-items: flex-start; background: #fff; border-radius: 12rpx; padding: 24rpx; margin-bottom: 12rpx; }
.point-icon { font-size: 24rpx; margin-right: 12rpx; flex-shrink: 0; margin-top: 16rpx; }
.point-text { flex: 1; min-height: 60rpx; font-size: 28rpx; color: #1A1A1A; line-height: 1.6; }

.actions { display: flex; gap: 16rpx; padding: 24rpx; }
.act { flex: 1; padding: 16rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--primary { background: #4A90D9; }
.act--primary text { color: #fff; }
.act--secondary { background: #EDF1F5; }
.act--secondary text { color: #5A5A5A; }
.act--danger { background: rgba(224,85,85,0.1); }
.act--danger text { color: #E05555; }
.empty { text-align: center; padding-top: 200rpx; color: #999; }
</style>
