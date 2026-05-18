<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('stitch')
const images = ref<string[]>([])

const tabs = [
  { key: 'stitch', label: '长图拼接' },
  { key: 'grid', label: '九宫格' },
  { key: 'meme', label: '表情包' },
]

function pickImages(count = 2) {
  uni.chooseImage({
    count,
    sourceType: ['album', 'camera'],
    success: (res) => {
      images.value = res.tempFilePaths
    },
  })
}

function clearImages() {
  images.value = []
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

    <view class="body">
      <!-- Image grid preview -->
      <view v-if="images.length > 0" class="preview-grid">
        <image v-for="(img, i) in images" :key="i" class="preview-img" :src="img" mode="aspectFill" />
      </view>

      <view v-else class="hero">
        <text class="hero-icon">🎨</text>
        <text class="hero-text">选择图片开始制作</text>
      </view>

      <!-- Controls per tab -->
      <view class="controls">
        <text v-if="activeTab === 'stitch'" class="ctrl-desc">选择2张以上图片，纵向或横向拼接成长图</text>
        <text v-else-if="activeTab === 'grid'" class="ctrl-desc">选择1张图片，切割为3×3九宫格，适合发朋友圈</text>
        <text v-else class="ctrl-desc">选择1张图片，配上经典上下文字，制作表情包</text>
      </view>

      <view class="actions">
        <view class="act act--secondary" @tap="clearImages"><text>清除</text></view>
        <view class="act act--primary" @tap="pickImages(activeTab === 'grid' || activeTab === 'meme' ? 1 : 9)">
          <text>{{ activeTab === 'stitch' ? '选择多张图片' : '选择图片' }}</text>
        </view>
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

.preview-grid { display: flex; flex-wrap: wrap; gap: 8rpx; margin-bottom: 24rpx; }
.preview-img { width: 230rpx; height: 230rpx; border-radius: 12rpx; background: #fff; }

.controls { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.ctrl-desc { font-size: 26rpx; color: #999; line-height: 1.6; }

.actions { display: flex; gap: 16rpx; }
.act { flex: 1; padding: 16rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--primary { background: #4A90D9; }
.act--primary text { color: #fff; }
.act--secondary { background: #EDF1F5; }
.act--secondary text { color: #5A5A5A; }
</style>
