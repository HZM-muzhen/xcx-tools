<script setup lang="ts">
const props = defineProps<{
  title: string
  showBack?: boolean
}>()

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page-header">
    <view v-if="showBack" class="page-header__back" @tap="goBack">
      <text class="page-header__back-icon">←</text>
    </view>
    <text class="page-header__title">{{ title }}</text>
    <view class="page-header__spacer" />
  </view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.page-header {
  display: flex;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border-light;
  height: 88rpx;

  &__back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__back-icon {
    font-size: 36rpx;
    color: $color-primary;
    font-weight: 700;
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: $font-lg;
    font-weight: 700;
    color: $color-text;
  }

  &__spacer {
    width: 60rpx;
  }
}
</style>
