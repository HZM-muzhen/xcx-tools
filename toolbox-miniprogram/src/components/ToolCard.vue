<script setup lang="ts">
import type { ToolDefinition } from '@/data/tools'

const props = defineProps<{
  tool: ToolDefinition
  compact?: boolean
}>()

const emit = defineEmits<{
  click: [id: string]
}>()
</script>

<template>
  <view class="tool-card" :class="{ 'tool-card--compact': compact }" @tap="emit('click', tool.id)">
    <view class="tool-card__icon-wrap">
      <text class="tool-card__icon">{{ tool.icon }}</text>
    </view>
    <view class="tool-card__info">
      <text class="tool-card__name">{{ tool.name }}</text>
      <text v-if="!compact" class="tool-card__desc">{{ tool.description }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.tool-card {
  background: $color-bg-card;
  border-radius: $radius-md;
  padding: $spacing-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: $shadow-card;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.96);
  }

  &--compact {
    flex-shrink: 0;
    width: 160rpx;
    padding: $spacing-sm;
  }

  &__icon-wrap {
    width: 80rpx;
    height: 80rpx;
    border-radius: $radius-md;
    background: $color-primary-bg;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $spacing-sm;
  }

  &__icon {
    font-size: 40rpx;
  }

  &__info {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__name {
    font-size: $font-sm;
    font-weight: 600;
    color: $color-text;
    margin-bottom: 4rpx;
  }

  &__desc {
    font-size: $font-xs;
    color: $color-text-muted;
    line-height: 1.4;
  }
}
</style>
