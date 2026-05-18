<script setup lang="ts">
export interface Tab {
  key: string
  label: string
}

const props = defineProps<{
  tabs: Tab[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [key: string]
}>()
</script>

<template>
  <scroll-view scroll-x class="tab-nav" :show-scrollbar="false">
    <view class="tab-nav__row">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-nav__item"
        :class="{ 'tab-nav__item--active': modelValue === tab.key }"
        @tap="emit('update:modelValue', tab.key)"
      >
        <text class="tab-nav__label">{{ tab.label }}</text>
      </view>
    </view>
  </scroll-view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.tab-nav {
  background: $color-bg-card;
  border-bottom: 1rpx solid $color-border-light;

  &__row {
    display: inline-flex;
    padding: 0 $spacing-md;
    gap: 8rpx;
  }

  &__item {
    padding: $spacing-sm $spacing-md;
    border-bottom: 4rpx solid transparent;
    flex-shrink: 0;
  }

  &__item--active {
    border-bottom-color: $color-primary;

    .tab-nav__label {
      color: $color-primary;
      font-weight: 600;
    }
  }

  &__label {
    font-size: $font-sm;
    color: $color-text-secondary;
  }
}
</style>
