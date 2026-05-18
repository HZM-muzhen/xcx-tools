<script setup lang="ts">
import { ref } from 'vue'

const imagePath = ref('')
const isProcessing = ref(false)

function takePhoto() {
  uni.chooseImage({
    count: 1, sourceType: ['camera'],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      doOCR()
    },
  })
}

function pickFromAlbum() {
  uni.chooseImage({
    count: 1, sourceType: ['album'],
    success: (res) => {
      imagePath.value = res.tempFilePaths[0]
      doOCR()
    },
  })
}

async function doOCR() {
  if (!imagePath.value) return
  isProcessing.value = true
  try {
    // #ifdef MP-WEIXIN
    const envId = uni.getStorageSync('cloudEnvId')
    if (envId) {
      const uploadRes = await (wx as any).cloud.uploadFile({
        cloudPath: 'ocr/' + Date.now() + '.png',
        filePath: imagePath.value,
      })
      const ocrRes = await (wx as any).cloud.callFunction({
        name: 'ocr', data: { fileID: uploadRes.fileID },
      })
      if (ocrRes.result?.text) {
        uni.navigateTo({
          url: '/pages/tools/ocr/ocr-result?text=' + encodeURIComponent(ocrRes.result.text) +
               '&image=' + encodeURIComponent(imagePath.value),
        })
        return
      }
    }
    // #endif
    // Fallback: navigate with placeholder
    uni.navigateTo({
      url: '/pages/tools/ocr/ocr-result?text=' + encodeURIComponent('OCR 识别需要配置云环境\n请在"我的"页面设置云环境ID') +
           '&image=' + encodeURIComponent(imagePath.value),
    })
  } catch {
    uni.showToast({ title: '识别失败，请重试', icon: 'none' })
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <view class="page">
    <view class="hero">
      <text class="hero-icon">📷</text>
      <text class="hero-title">文字识别</text>
      <text class="hero-desc">拍照或从相册选择图片，识别其中的文字</text>
    </view>

    <view v-if="isProcessing" class="loading">
      <text>🔍 正在识别文字...</text>
    </view>

    <view v-if="imagePath" class="preview">
      <image class="preview-img" :src="imagePath" mode="aspectFit" />
    </view>

    <view class="actions">
      <view class="act" @tap="takePhoto">
        <text class="act-icon">📸</text>
        <text class="act-text">拍照识别</text>
      </view>
      <view class="act" @tap="pickFromAlbum">
        <text class="act-icon">🖼️</text>
        <text class="act-text">相册选择</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.hero { display: flex; flex-direction: column; align-items: center; padding: 80rpx 24rpx 40rpx; }
.hero-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.hero-title { font-size: 40rpx; font-weight: 700; color: #1A1A1A; margin-bottom: 12rpx; }
.hero-desc { font-size: 26rpx; color: #999; text-align: center; line-height: 1.6; }

.loading { text-align: center; padding: 40rpx; }
.loading text { font-size: 26rpx; color: #4A90D9; }

.preview { margin: 0 24rpx 32rpx; border-radius: 16rpx; overflow: hidden; background: #fff; }
.preview-img { width: 100%; height: 400rpx; }

.actions { display: flex; gap: 24rpx; padding: 0 24rpx; }
.act { flex: 1; background: #fff; border-radius: 20rpx; padding: 48rpx 24rpx; text-align: center; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.act-icon { font-size: 56rpx; display: block; margin-bottom: 16rpx; }
.act-text { font-size: 26rpx; color: #1A1A1A; font-weight: 600; }
</style>
