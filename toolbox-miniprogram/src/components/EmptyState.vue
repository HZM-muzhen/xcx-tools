<script setup lang="ts">
const props = defineProps<{
  icon?: string
  title: string
  description?: string
  actionText?: string
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <view class="empty">
    <text v-if="icon" class="empty__icon">{{ icon }}</text>
    <text class="empty__title">{{ title }}</text>
    <text v-if="description" class="empty__desc">{{ description }}</text>
    <view v-if="actionText" class="empty__action" @tap="emit('action')">
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx $spacing-xl;
  text-align: center;

  &__icon {
    font-size: 80rpx;
    margin-bottom: $spacing-md;
  }

  &__title {
    font-size: $font-lg;
    color: $color-text;
    font-weight: 600;
    margin-bottom: $spacing-xs;
  }

  &__desc {
    font-size: $font-sm;
    color: $color-text-muted;
    line-height: 1.5;
  }

  &__action {
    margin-top: $spacing-lg;
    background: $color-primary;
    color: #fff;
    border-radius: $radius-full;
    padding: $spacing-sm $spacing-xl;
    font-size: $font-sm;
  }
}
</style>
