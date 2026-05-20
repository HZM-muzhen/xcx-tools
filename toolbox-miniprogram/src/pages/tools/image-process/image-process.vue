<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('compress')
const sourceImage = ref('')
const previewImage = ref('')
const isProcessing = ref(false)

const tabs = [
  { key: 'compress', label: '压缩' },
  { key: 'watermark', label: '水印' },
  { key: 'rotate', label: '旋转' },
  { key: 'filter', label: '滤镜' },
]

const compressQuality = ref(80)
const compressedSize = ref('')
const watermarkText = ref('')
const rotateAngle = ref(90)

function pickImage() {
  uni.chooseImage({
    count: 1, sourceType: ['album', 'camera'],
    success: (res) => { sourceImage.value = res.tempFilePaths[0]; previewImage.value = res.tempFilePaths[0]; compressedSize.value = '' },
  })
}

function doCompress() {
  if (!sourceImage.value) return
  isProcessing.value = true
  uni.compressImage({
    src: sourceImage.value, quality: compressQuality.value,
    success: (res) => {
      previewImage.value = res.tempFilePath
      uni.getFileInfo({
        filePath: res.tempFilePath,
        success: (info) => { compressedSize.value = (info.size / 1024).toFixed(1) + ' KB' },
        complete: () => { isProcessing.value = false },
      })
    },
    fail: () => { uni.showToast({ title: '压缩失败', icon: 'none' }); isProcessing.value = false },
  })
}

function doWatermark() {
  if (!sourceImage.value || !watermarkText.value) {
    uni.showToast({ title: '请选择图片并输入水印文字', icon: 'none' }); return
  }
  isProcessing.value = true
  // #ifdef MP-WEIXIN
  try {
    const query = uni.createSelectorQuery()
    wx.getImageInfo({
      src: sourceImage.value,
      success: (info: any) => {
        const w = info.width; const h = info.height
        const offCanvas = wx.createOffscreenCanvas({ type: '2d', width: w, height: h })
        const ctx = offCanvas.getContext('2d')
        const img = offCanvas.createImage()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, w, h)
          const fs = Math.max(Math.floor(w * 0.05), 24)
          ctx.font = 'bold ' + fs + 'px sans-serif'
          ctx.fillStyle = 'rgba(255,255,255,0.7)'
          ctx.strokeStyle = 'rgba(0,0,0,0.3)'
          ctx.lineWidth = 2
          const tw = ctx.measureText(watermarkText.value).width
          ctx.fillText(watermarkText.value, w - tw - 20, h - fs * 0.5)
          ctx.strokeText(watermarkText.value, w - tw - 20, h - fs * 0.5)
          wx.canvasToTempFilePath({
            canvas: offCanvas,
            success: (res: any) => { previewImage.value = res.tempFilePath; uni.showToast({ title: '水印已添加', icon: 'success' }) },
            fail: () => { uni.showToast({ title: '导出失败', icon: 'none' }) },
            complete: () => { isProcessing.value = false },
          })
        }
        img.src = sourceImage.value
      },
      fail: () => { uni.showToast({ title: '获取图片信息失败', icon: 'none' }); isProcessing.value = false },
    })
  } catch { uni.showToast({ title: '需要微信基础库 2.16+', icon: 'none' }); isProcessing.value = false }
  // #endif
}

function doRotate() {
  if (!sourceImage.value) return
  isProcessing.value = true
  // #ifdef MP-WEIXIN
  try {
    wx.getImageInfo({
      src: sourceImage.value,
      success: (info: any) => {
        const w = info.width; const h = info.height
        const cw = rotateAngle.value === 180 ? w : h
        const ch = rotateAngle.value === 180 ? h : w
        const offCanvas = wx.createOffscreenCanvas({ type: '2d', width: cw, height: ch })
        const ctx = offCanvas.getContext('2d')
        const img = offCanvas.createImage()
        img.onload = () => {
          ctx.translate(cw / 2, ch / 2)
          ctx.rotate((rotateAngle.value * Math.PI) / 180)
          ctx.drawImage(img, -w / 2, -h / 2, w, h)
          wx.canvasToTempFilePath({
            canvas: offCanvas,
            success: (res: any) => { previewImage.value = res.tempFilePath; uni.showToast({ title: '旋转完成', icon: 'success' }) },
            complete: () => { isProcessing.value = false },
          })
        }
        img.src = sourceImage.value
      },
      fail: () => { uni.showToast({ title: '处理失败', icon: 'none' }); isProcessing.value = false },
    })
  } catch { uni.showToast({ title: '需要微信基础库 2.16+', icon: 'none' }); isProcessing.value = false }
  // #endif
}

function saveImage() {
  if (!previewImage.value) return
  uni.saveImageToPhotosAlbum({
    filePath: previewImage.value,
    success: () => { uni.showToast({ title: '已保存到相册', icon: 'success' }) },
    fail: () => { uni.showToast({ title: '请检查相册权限', icon: 'none' }) },
  })
}

function resetImage() { previewImage.value = sourceImage.value; compressedSize.value = '' }
</script>

<template>
  <view class="page">
    <scroll-view scroll-x class="tabs" :show-scrollbar="false">
      <view class="tabs-row">
        <view v-for="t in tabs" :key="t.key" class="tab" :class="{ active: activeTab === t.key }" @tap="activeTab = t.key">
          <text>{{ t.label }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-if="!sourceImage" class="hero" @tap="pickImage">
      <text class="hero-icon">🖼️</text>
      <text class="hero-text">点击选择图片开始编辑</text>
    </view>

    <view v-else class="workspace">
      <view class="preview-wrap">
        <image class="preview" :src="previewImage" mode="aspectFit" />
        <view v-if="isProcessing" class="processing"><text>处理中...</text></view>
      </view>

      <!-- Compress -->
      <view v-if="activeTab === 'compress'" class="controls">
        <text class="ctrl-label">压缩质量: {{ compressQuality }}%</text>
        <slider :value="compressQuality" :min="10" :max="100" :step="5" @change="(e: any) => compressQuality = e.detail.value" />
        <text v-if="compressedSize" class="result">压缩后: {{ compressedSize }}</text>
        <view class="btn" @tap="doCompress"><text>开始压缩</text></view>
      </view>

      <!-- Watermark -->
      <view v-if="activeTab === 'watermark'" class="controls">
        <text class="ctrl-label">水印文字</text>
        <input class="ctrl-input" v-model="watermarkText" placeholder="输入水印文字..." />
        <view class="btn" @tap="doWatermark"><text>添加水印</text></view>
      </view>

      <!-- Rotate -->
      <view v-if="activeTab === 'rotate'" class="controls">
        <text class="ctrl-label">旋转角度</text>
        <view class="chip-row">
          <view v-for="deg in [90, 180, 270]" :key="deg" class="chip" :class="{ active: rotateAngle === deg }"
            @tap="rotateAngle = deg; doRotate()"><text>{{ deg }}°</text></view>
        </view>
      </view>

      <!-- Filter -->
      <view v-if="activeTab === 'filter'" class="controls">
        <text class="ctrl-hint">滤镜功能需微信基础库 2.19+，真机上可用黑白、复古等效果</text>
      </view>

      <view class="actions">
        <view class="act act--sec" @tap="resetImage"><text>重置</text></view>
        <view class="act act--sec" @tap="pickImage"><text>换图</text></view>
        <view class="act act--pri" @tap="saveImage"><text>保存到相册</text></view>
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
.preview-wrap { position: relative; border-radius: 16rpx; overflow: hidden; background: #fff; margin-bottom: 24rpx; }
.preview { width: 100%; height: 500rpx; }
.processing { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; }
.processing text { color: #fff; font-size: 28rpx; }

.controls { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.ctrl-label { font-size: 26rpx; color: #5A5A5A; display: block; margin-bottom: 16rpx; }
.ctrl-input { background: #F5F7FA; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; margin-bottom: 16rpx; }
.ctrl-hint { font-size: 26rpx; color: #999; text-align: center; padding: 24rpx 0; display: block; }
.result { font-size: 24rpx; color: #5B9E8A; text-align: center; display: block; margin-bottom: 12rpx; }
.btn { background: #4A90D9; border-radius: 999rpx; padding: 16rpx; text-align: center; }
.btn text { color: #fff; font-size: 26rpx; font-weight: 600; }

.chip-row { display: flex; gap: 16rpx; }
.chip { padding: 16rpx 32rpx; border-radius: 12rpx; background: #EDF1F5; font-size: 28rpx; color: #5A5A5A; }
.chip.active { background: #4A90D9; color: #fff; }

.actions { display: flex; gap: 16rpx; padding-bottom: 48rpx; }
.act { flex: 1; padding: 18rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--pri { background: #4A90D9; }
.act--pri text { color: #fff; }
.act--sec { background: #fff; }
.act--sec text { color: #5A5A5A; }
</style>
