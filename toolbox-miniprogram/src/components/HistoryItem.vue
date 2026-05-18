<script setup lang="ts">
import type { HistoryEntry } from '@/stores/history'
import { toolRegistry } from '@/data/tools'

const props = defineProps<{
  entry: HistoryEntry
}>()

const emit = defineEmits<{
  click: [id: string]
  delete: [id: string]
}>()

const tool = toolRegistry.find(t => t.id === props.entry.toolId)

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return month + '-' + day
}
</script>

<template>
  <view class="history-item" @tap="emit('click', entry.id)">
    <view class="history-item__icon">
      <text>{{ tool?.icon || '📄' }}</text>
    </view>
    <view class="history-item__body">
      <text class="history-item__title">{{ entry.title }}</text>
      <text class="history-item__summary">{{ entry.summary }}</text>
    </view>
    <view class="history-item__right">
      <text class="history-item__time">{{ formatTime(entry.createdAt) }}</text>
      <text v-if="entry.favorited" class="history-item__fav">⭐</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.history-item {
  display: flex;
  align-items: center;
  padding: $spacing-md;
  background: $color-bg-card;
  margin: $spacing-xs $spacing-md;
  border-radius: $radius-sm;

  &__icon {
    width: 72rpx;
    height: 72rpx;
    border-radius: $radius-sm;
    background: $color-primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: $spacing-md;
    flex-shrink: 0;

    text {
      font-size: 32rpx;
    }
  }

  &__body {
    flex: 1;
    overflow: hidden;
  }

  &__title {
    font-size: $font-sm;
    font-weight: 600;
    color: $color-text;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__summary {
    font-size: $font-xs;
    color: $color-text-muted;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-top: 4rpx;
  }

  &__right {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-left: $spacing-sm;
  }

  &__time {
    font-size: $font-xs;
    color: $color-text-muted;
  }

  &__fav {
    font-size: 20rpx;
    margin-top: 4rpx;
  }
}
</style>
