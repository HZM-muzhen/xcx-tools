<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { render } from '@/utils/templateEngine'
import { useHistoryStore } from '@/stores/history'

const historyStore = useHistoryStore()
const generatedText = ref('')
const templateId = ref('')
const templateName = ref('')
const favorited = ref(false)

onLoad((query: any) => {
  try {
    const d = JSON.parse(decodeURIComponent(query?.data || '{}'))
    templateId.value = d.template?.id || ''
    templateName.value = d.template?.name || ''
    generatedText.value = render(d.template?.template || '', d.variables || {})
    // Save to history
    historyStore.addEntry({
      id: Date.now().toString(), toolId: 'copywriting', type: 'copywriting',
      title: templateName.value, summary: generatedText.value.slice(0, 80),
      data: { text: generatedText.value, templateId: templateId.value },
      createdAt: Date.now(), favorited: false,
    })
  } catch {
    generatedText.value = '文案生成失败，请返回重试'
  }
})

function copyText() {
  uni.setClipboardData({ data: generatedText.value })
  uni.showToast({ title: '已复制', icon: 'success' })
}

function toggleFav() {
  favorited.value = !favorited.value
  if (favorited.value) {
    const last = historyStore.recentEntries()[0]
    if (last) historyStore.toggleFavorite(last.id)
  }
}
</script>

<template>
  <view class="page">
    <view class="header">
      <text class="title">{{ templateName }}</text>
    </view>

    <view class="result-card">
      <text class="result-text">{{ generatedText }}</text>
    </view>

    <view class="actions">
      <view class="act act--fav" :class="{ fav: favorited }" @tap="toggleFav">
        <text>{{ favorited ? '⭐ 已收藏' : '☆ 收藏' }}</text>
      </view>
      <view class="act act--copy" @tap="copyText">
        <text>📋 复制文案</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.header { padding: 32rpx 24rpx 24rpx; }
.title { font-size: 36rpx; font-weight: 700; color: #1A1A1A; }

.result-card { margin: 0 24rpx; background: #fff; border-radius: 16rpx; padding: 32rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.result-text { font-size: 28rpx; color: #1A1A1A; line-height: 1.8; white-space: pre-wrap; }

.actions { display: flex; gap: 16rpx; padding: 32rpx 24rpx; }
.act { flex: 1; padding: 20rpx; border-radius: 999rpx; text-align: center; }
.act text { font-size: 26rpx; font-weight: 600; }
.act--fav { background: #EDF1F5; }
.act--fav text { color: #5A5A5A; }
.fav { background: rgba(240,160,64,0.15); }
.fav text { color: #F0A040; }
.act--copy { background: #4A90D9; }
.act--copy text { color: #fff; }
</style>
