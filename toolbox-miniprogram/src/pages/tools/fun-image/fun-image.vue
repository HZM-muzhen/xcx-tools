<script setup lang="ts">
import { ref, nextTick } from 'vue'

const activeTab = ref('meme')
const images = ref<string[]>([])
const resultImage = ref('')
const isProcessing = ref(false)
const showCanvas = ref(false)

const tabs = [
  { key: 'stitch', label: '长图拼接' },
  { key: 'grid', label: '九宫格' },
  { key: 'meme', label: '表情包' },
]

const memeTopText = ref('')
const memeBottomText = ref('')

function pickImages(count = 2) {
  uni.chooseImage({
    count, sourceType: ['album', 'camera'],
    success: (res) => { images.value = res.tempFilePaths; resultImage.value = '' },
  })
}

function clearAll() { images.value = []; resultImage.value = ''; showCanvas.value = false; isProcessing.value = false }

function doMeme() {
  if (images.value.length < 1 || (!memeTopText.value && !memeBottomText.value)) {
    uni.showToast({ title: '请选择图片并输入文字', icon: 'none' }); return
  }
  isProcessing.value = true
  showCanvas.value = true

  nextTick(() => {
    // #ifdef MP-WEIXIN
    wx.getImageInfo({
      src: images.value[0],
      success: (info: any) => {
        const w = info.width; const h = info.height
        const ctx = uni.createCanvasContext('memeCanvas')
        ctx.drawImage(images.value[0], 0, 0, w, h)
        const fs = Math.max(Math.floor(w * 0.08), 28)
        ctx.setFontSize(fs)
        ctx.setTextAlign('center')
        ctx.setFillStyle('#ffffff')
        // Shadow for stroke effect
        ctx.setShadow(2, 2, 4, 'rgba(0,0,0,0.7)')
        if (memeTopText.value) ctx.fillText(memeTopText.value, w / 2, fs)
        if (memeBottomText.value) ctx.fillText(memeBottomText.value, w / 2, h - fs * 0.3)
        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'memeCanvas',
              width: w, height: h,
              destWidth: w, destHeight: h,
              success: (res: any) => {
                resultImage.value = res.tempFilePath
                showCanvas.value = false
                uni.showToast({ title: '表情包已生成，点击下方按钮保存', icon: 'success', duration: 2000 })
              },
              fail: (e: any) => {
                uni.showToast({ title: '生成失败: ' + (e.errMsg || '请重试'), icon: 'none' })
              },
              complete: () => { isProcessing.value = false },
            })
          }, 500)
        })
      },
      fail: () => { uni.showToast({ title: '读取图片信息失败', icon: 'none' }); isProcessing.value = false },
    })
    // #endif
  })
}

function doStitch() {
  if (images.value.length < 2) { uni.showToast({ title: '请选择至少2张图片', icon: 'none' }); return }
  isProcessing.value = true
  showCanvas.value = true

  nextTick(() => {
    // #ifdef MP-WEIXIN
    const paths = images.value.slice()
    // Get all image sizes
    let loaded = 0
    const sizes: { w: number; h: number }[] = []
    paths.forEach((p, i) => {
      wx.getImageInfo({
        src: p,
        success: (info: any) => {
          const scale = info.width > 750 ? 750 / info.width : 1
          sizes[i] = { w: Math.floor(info.width * scale), h: Math.floor(info.height * scale) }
          loaded++
          if (loaded === paths.length) renderStitchOnCanvas(paths, sizes)
        },
        fail: () => { uni.showToast({ title: '读取图片失败', icon: 'none' }); isProcessing.value = false },
      })
    })
    // #endif
  })
}

function renderStitchOnCanvas(paths: string[], sizes: { w: number; h: number }[]) {
  const maxW = Math.max(...sizes.map(s => s.w))
  const totalH = sizes.reduce((s, sz) => s + sz.h, 0)
  // #ifdef MP-WEIXIN
  const ctx = uni.createCanvasContext('memeCanvas')
  ctx.setFillStyle('#ffffff')
  ctx.fillRect(0, 0, maxW, totalH)

  let currentY = 0
  function drawOne(idx: number) {
    if (idx >= paths.length) {
      ctx.draw(false, () => {
        setTimeout(() => {
          wx.canvasToTempFilePath({
            canvasId: 'memeCanvas',
            width: maxW, height: totalH,
            destWidth: maxW, destHeight: totalH,
            success: (res: any) => {
              resultImage.value = res.tempFilePath
              showCanvas.value = false
              uni.showToast({ title: '拼接完成，点击下方按钮保存', icon: 'success', duration: 2000 })
            },
            fail: () => { uni.showToast({ title: '导出失败', icon: 'none' }) },
            complete: () => { isProcessing.value = false },
          })
        }, 500)
      })
      return
    }
    ctx.drawImage(paths[idx], 0, currentY, sizes[idx].w, sizes[idx].h)
    currentY += sizes[idx].h
    drawOne(idx + 1)
  }
  drawOne(0)
  // #endif
}

function doGrid() {
  if (images.value.length < 1) { uni.showToast({ title: '请选择1张图片', icon: 'none' }); return }
  isProcessing.value = true
  showCanvas.value = true

  nextTick(() => {
    // #ifdef MP-WEIXIN
    wx.getImageInfo({
      src: images.value[0],
      success: (info: any) => {
        const size = Math.min(info.width, info.height)
        const piece = Math.floor(size / 3)
        const offX = Math.floor((info.width - piece * 3) / 2)
        const offY = Math.floor((info.height - piece * 3) / 2)
        const ctx = uni.createCanvasContext('memeCanvas')
        ctx.drawImage(images.value[0], offX + piece, offY + piece, piece, piece, 0, 0, piece, piece)
        ctx.draw(false, () => {
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvasId: 'memeCanvas',
              width: piece, height: piece,
              destWidth: piece, destHeight: piece,
              success: (res: any) => {
                resultImage.value = res.tempFilePath
                showCanvas.value = false
                uni.showToast({ title: '九宫格已生成(示例第5块)', icon: 'success', duration: 2000 })
              },
              fail: () => { uni.showToast({ title: '导出失败', icon: 'none' }) },
              complete: () => { isProcessing.value = false },
            })
          }, 500)
        })
      },
      fail: () => { uni.showToast({ title: '读取图片失败', icon: 'none' }); isProcessing.value = false },
    })
    // #endif
  })
}

function saveResult() {
  if (!resultImage.value) { uni.showToast({ title: '请先生成图片', icon: 'none' }); return }
  // #ifdef MP-WEIXIN
  wx.saveImageToPhotosAlbum({
    filePath: resultImage.value,
    success: () => { uni.showToast({ title: '已保存到相册', icon: 'success' }) },
    fail: (e: any) => {
      if (e.errMsg && e.errMsg.includes('auth')) {
        uni.showModal({
          title: '需要相册权限',
          content: '请在设置中允许小程序访问相册',
          success: (res: any) => {
            if (res.confirm) wx.openSetting({})
          },
        })
      } else {
        uni.showToast({ title: '保存失败，请长按图片手动保存', icon: 'none', duration: 2500 })
      }
    },
  })
  // #endif
}
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

    <view class="body">
      <!-- Canvas (hidden, used for rendering) -->
      <canvas
        v-if="showCanvas"
        canvas-id="memeCanvas"
        class="hidden-canvas"
      />

      <!-- Image picker area -->
      <view v-if="images.length > 0" class="preview-area">
        <scroll-view scroll-x class="preview-scroll" :show-scrollbar="false">
          <view class="preview-row">
            <image v-for="(img, i) in images" :key="i" class="thumb" :src="img" mode="aspectFill" @tap="pickImages(9)" />
          </view>
        </scroll-view>

        <view v-if="isProcessing" class="processing">
          <text>⏳ 处理中...</text>
        </view>

        <view v-if="resultImage" class="result-area">
          <text class="result-label">✅ 生成结果（长按图片可保存）</text>
          <image class="result-img" :src="resultImage" mode="widthFix" :show-menu-by-longpress="true" />
        </view>
      </view>

      <view v-else class="hero">
        <text class="hero-icon">🎨</text>
        <text class="hero-text">选择图片开始制作</text>
      </view>

      <!-- Controls -->
      <view v-if="activeTab === 'meme'" class="controls">
        <text class="ctrl-desc">选择一张图片，添加经典上下文字制作表情包</text>
        <input class="ctrl-input" v-model="memeTopText" placeholder="上方文字（可选）" />
        <input class="ctrl-input" v-model="memeBottomText" placeholder="下方文字（可选）" />
        <view class="btn" :class="{ disabled: images.length < 1 || (!memeTopText && !memeBottomText) }" @tap="doMeme">
          <text>{{ images.length < 1 ? '请先选择图片' : '生成表情包' }}</text>
        </view>
      </view>

      <view v-if="activeTab === 'stitch'" class="controls">
        <text class="ctrl-desc">选择多张图片，纵向拼接为一张长图</text>
        <view class="btn" :class="{ disabled: images.length < 2 }" @tap="doStitch">
          <text>{{ images.length < 2 ? '请选择至少2张图片' : '开始拼接' }}</text>
        </view>
      </view>

      <view v-if="activeTab === 'grid'" class="controls">
        <text class="ctrl-desc">选择一张图片，切割为3×3九宫格。示例展示第5块</text>
        <view class="btn" :class="{ disabled: images.length < 1 }" @tap="doGrid">
          <text>{{ images.length < 1 ? '请选择1张图片' : '开始切割' }}</text>
        </view>
      </view>

      <!-- Actions -->
      <view class="actions">
        <view class="act act--sec" @tap="clearAll"><text>清除</text></view>
        <view class="act act--pri" @tap="pickImages(activeTab === 'stitch' ? 9 : 1)">
          <text>选择图片</text>
        </view>
      </view>

      <!-- Save -->
      <view v-if="resultImage" class="save-bar" @tap="saveResult">
        <text>💾 保存到相册</text>
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

.body { padding: 24rpx; }
.hero { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.hero-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.hero-text { font-size: 26rpx; color: #999; }

.hidden-canvas { position: fixed; top: -9999rpx; left: -9999rpx; width: 750rpx; height: 750rpx; }

.preview-scroll { white-space: nowrap; margin-bottom: 24rpx; }
.preview-row { display: inline-flex; gap: 12rpx; }
.thumb { width: 160rpx; height: 160rpx; border-radius: 12rpx; background: #fff; flex-shrink: 0; }

.processing { text-align: center; padding: 24rpx; }
.processing text { font-size: 26rpx; color: #4A90D9; }

.result-area { background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 20rpx; }
.result-label { font-size: 24rpx; color: #5B9E8A; display: block; margin-bottom: 12rpx; text-align: center; }
.result-img { width: 100%; border-radius: 8rpx; }

.controls { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 20rpx; }
.ctrl-desc { font-size: 26rpx; color: #999; line-height: 1.6; display: block; margin-bottom: 16rpx; }
.ctrl-input { background: #F5F7FA; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; margin-bottom: 12rpx; }
.btn { background: #4A90D9; border-radius: 999rpx; padding: 16rpx; text-align: center; }
.btn text { color: #fff; font-size: 26rpx; font-weight: 600; }
.disabled { background: #ccc; }

.actions { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.act { flex: 1; padding: 16rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--pri { background: #4A90D9; }
.act--pri text { color: #fff; }
.act--sec { background: #EDF1F5; }
.act--sec text { color: #5A5A5A; }

.save-bar { background: #5B9E8A; border-radius: 999rpx; padding: 20rpx; text-align: center; }
.save-bar text { color: #fff; font-size: 28rpx; font-weight: 600; }
</style>
