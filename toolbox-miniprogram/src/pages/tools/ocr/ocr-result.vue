<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useHistoryStore } from '@/stores/history'

const historyStore = useHistoryStore()
const recognizedText = ref('')
const imagePath = ref('')

onLoad((query: any) => {
  recognizedText.value = decodeURIComponent(query?.text || '')
  imagePath.value = decodeURIComponent(query?.image || '')
  // Save to history
  historyStore.addEntry({
    id: Date.now().toString(), toolId: 'ocr', type: 'ocr',
    title: 'OCR 识别 ' + new Date().toLocaleDateString(),
    summary: recognizedText.value.slice(0, 80),
    data: { text: recognizedText.value, image: imagePath.value },
    createdAt: Date.now(), favorited: false,
  })
})

function copyText() {
  uni.setClipboardData({ data: recognizedText.value })
  uni.showToast({ title: '已复制', icon: 'success' })
}
</script>

<template>
  <view class="page">
    <view v-if="imagePath" class="image-wrap">
      <image class="image" :src="imagePath" mode="aspectFit" />
    </view>
    <view class="result-card">
      <text class="result-label">识别结果</text>
      <textarea class="result-textarea" v-model="recognizedText" :auto-height="true" />
    </view>
    <view class="actions">
      <view class="act act--primary" @tap="copyText">
        <text>📋 复制全部文字</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.image-wrap { margin: 24rpx; border-radius: 16rpx; overflow: hidden; background: #fff; }
.image { width: 100%; height: 400rpx; }
.result-card { margin: 0 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.result-label { font-size: 26rpx; color: #999; display: block; margin-bottom: 16rpx; }
.result-textarea { width: 100%; min-height: 300rpx; font-size: 28rpx; color: #1A1A1A; line-height: 1.8; }
.actions { padding: 32rpx 24rpx; }
.act { padding: 20rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--primary { background: #4A90D9; }
.act--primary text { color: #fff; }
</style>
