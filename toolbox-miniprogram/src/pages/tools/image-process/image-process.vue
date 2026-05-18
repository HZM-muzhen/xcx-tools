<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('crop')
const sourceImage = ref('')
const previewImage = ref('')

const tabs = [
  { key: 'crop', label: '裁剪' },
  { key: 'rotate', label: '旋转' },
  { key: 'filter', label: '滤镜' },
  { key: 'compress', label: '压缩' },
  { key: 'watermark', label: '水印' },
]

const watermarkText = ref('')
const compressQuality = ref(80)

function pickImage() {
  uni.chooseImage({
    count: 1, sourceType: ['album', 'camera'],
    success: (res) => {
      sourceImage.value = res.tempFilePaths[0]
      previewImage.value = res.tempFilePaths[0]
    },
  })
}

function saveImage() {
  if (!previewImage.value) return
  uni.saveImageToPhotosAlbum({
    filePath: previewImage.value,
    success: () => { uni.showToast({ title: '已保存到相册', icon: 'success' }) },
    fail: () => { uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' }) },
  })
}
</script>

<template>
  <view class="page">
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view class="tabs-row">
        <view v-for="t in tabs" :key="t.key"
          class="tab" :class="{ active: activeTab === t.key }"
          @tap="activeTab = t.key">
          <text>{{ t.label }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="!sourceImage" class="hero" @tap="pickImage">
      <text class="hero-icon">🖼️</text>
      <text class="hero-text">点击选择图片</text>
    </view>

    <view v-else class="workspace">
      <image class="preview" :src="previewImage" mode="aspectFit" />

      <view v-if="activeTab === 'compress'" class="controls">
        <text class="ctrl-label">压缩质量: {{ compressQuality }}%</text>
        <slider :value="compressQuality" :min="10" :max="100" :step="5" @change="(e: any) => compressQuality = e.detail.value" />
      </view>

      <view v-if="activeTab === 'watermark'" class="controls">
        <text class="ctrl-label">水印文字</text>
        <input class="ctrl-input" v-model="watermarkText" placeholder="输入水印文字..." />
      </view>

      <view v-if="activeTab !== 'compress' && activeTab !== 'watermark'" class="controls">
        <text class="ctrl-hint">此功能需要原生Canvas处理，开发中...</text>
      </view>

      <view class="actions">
        <view class="act act--secondary" @tap="pickImage"><text>重新选择</text></view>
        <view class="act act--primary" @tap="saveImage"><text>保存到相册</text></view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.tabs { white-space: nowrap; background: #fff; padding: 16rpx 24rpx; border-bottom: 1rpx solid #F2F4F6; }
.tabs-row { display: inline-flex; gap: 8rpx; }
.tab { padding: 12rpx 28rpx; border-radius: 999rpx; background: #EDF1F5; font-size: 26rpx; color: #5A5A5A; }
.active { background: #4A90D9; color: #fff; }

.hero { display: flex; flex-direction: column; align-items: center; padding: 160rpx 24rpx; }
.hero-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.hero-text { font-size: 26rpx; color: #999; }

.workspace { padding: 24rpx; }
.preview { width: 100%; height: 500rpx; background: #fff; border-radius: 16rpx; margin-bottom: 24rpx; }

.controls { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.ctrl-label { font-size: 26rpx; color: #5A5A5A; display: block; margin-bottom: 16rpx; }
.ctrl-input { background: #EDF1F5; border-radius: 12rpx; padding: 16rpx 24rpx; font-size: 26rpx; }
.ctrl-hint { font-size: 26rpx; color: #999; display: block; text-align: center; padding: 24rpx 0; }

.actions { display: flex; gap: 16rpx; }
.act { flex: 1; padding: 16rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--primary { background: #4A90D9; }
.act--primary text { color: #fff; }
.act--secondary { background: #EDF1F5; }
.act--secondary text { color: #5A5A5A; }
</style>
