<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHistoryStore } from '@/stores/history'
import { toolRegistry } from '@/data/tools'

const historyStore = useHistoryStore()
const activeType = ref<'all' | 'voice' | 'ocr' | 'copywriting' | 'image'>('all')

const types = [
  { key: 'all' as const, label: '全部' },
  { key: 'voice' as const, label: '语音' },
  { key: 'ocr' as const, label: 'OCR' },
  { key: 'copywriting' as const, label: '文案' },
  { key: 'image' as const, label: '图片' },
]

const filtered = computed(() => {
  if (activeType.value === 'all') return historyStore.recentEntries()
  return historyStore.entriesByType(activeType.value)
})

function fmt(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return new Date(ts).getMonth() + 1 + '-' + new Date(ts).getDate()
}

function goDetail(id: string) {
  const e = historyStore.getEntry(id)
  if (!e) return
  if (e.type === 'voice') uni.navigateTo({ url: '/pages/tools/voice-notes/note-detail?id=' + id })
}

function del(id: string) {
  uni.showModal({
    title: '确认删除',
    success: (res: any) => { if (res.confirm) historyStore.removeEntry(id) },
  })
}
</script>

<template>
  <view class="page">
    <view class="filter">
      <view v-for="t in types" :key="t.key"
        class="filter-item" :class="{ active: activeType === t.key }"
        @tap="activeType = t.key">
        <text>{{ t.label }}</text>
      </view>
    </view>

    <view v-if="filtered.length === 0" class="empty">
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无使用记录</text>
    </view>

    <view v-for="e in filtered" :key="e.id" class="item" @tap="goDetail(e.id)" @longpress="del(e.id)">
      <view class="item-icon">
        <text>{{ toolRegistry.find(t => t.id === e.toolId)?.icon || '📄' }}</text>
      </view>
      <view class="item-body">
        <text class="item-title">{{ e.title }}</text>
        <text class="item-summary">{{ e.summary }}</text>
      </view>
      <view class="item-right">
        <text class="item-time">{{ fmt(e.createdAt) }}</text>
        <text v-if="e.favorited" class="item-fav">⭐</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

.filter { display: flex; gap: 16rpx; padding: 16rpx 24rpx; background: #fff; border-bottom: 1rpx solid #F2F4F6; }
.filter-item { padding: 10rpx 28rpx; border-radius: 999rpx; background: #EDF1F5; font-size: 26rpx; color: #5A5A5A; }
.active { background: #4A90D9; color: #fff; }

.item { display: flex; align-items: center; padding: 24rpx; margin: 8rpx 24rpx; background: #fff; border-radius: 12rpx; }
.item-icon { width: 72rpx; height: 72rpx; border-radius: 12rpx; background: rgba(74,144,217,0.08); display: flex; align-items: center; justify-content: center; margin-right: 24rpx; flex-shrink: 0; }
.item-icon text { font-size: 32rpx; }
.item-body { flex: 1; overflow: hidden; }
.item-title { font-size: 26rpx; font-weight: 600; color: #1A1A1A; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-summary { font-size: 22rpx; color: #999; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 4rpx; }
.item-right { flex-shrink: 0; margin-left: 16rpx; text-align: right; }
.item-time { font-size: 22rpx; color: #999; }
.item-fav { font-size: 20rpx; display: block; margin-top: 4rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding-top: 200rpx; }
.empty-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 26rpx; color: #999; }
</style>
