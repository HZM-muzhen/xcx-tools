<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: []
  clear: []
}>()

function onInput(e: any) {
  emit('update:modelValue', e.detail.value)
}

function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <view class="search-bar">
    <view class="search-bar__icon">🔍</view>
    <input
      class="search-bar__input"
      :value="modelValue"
      :placeholder="placeholder || '搜索工具...'"
      @input="onInput"
      @confirm="emit('search')"
    />
    <view v-if="modelValue" class="search-bar__clear" @tap="onClear">
      <text>✕</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
@import '@/uni.scss';

.search-bar {
  display: flex;
  align-items: center;
  background: $color-bg-secondary;
  border-radius: $radius-full;
  padding: $spacing-sm $spacing-md;
  height: 72rpx;

  &__icon {
    font-size: $font-md;
    margin-right: $spacing-sm;
    flex-shrink: 0;
  }

  &__input {
    flex: 1;
    font-size: $font-sm;
    color: $color-text;
    background: transparent;
    height: 100%;
  }

  &__clear {
    width: 36rpx;
    height: 36rpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    text {
      font-size: 20rpx;
      color: $color-text-muted;
    }
  }
}
</style>
