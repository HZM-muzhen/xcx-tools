<script setup lang="ts">
import { ref, computed } from 'vue'
import { greetingCategories, type GreetingCard } from '@/data/greetingCards'

const activeCat = ref(greetingCategories[0].id)
const selectedCard = ref<GreetingCard | null>(null)

const categories = greetingCategories

const currentCards = computed(() => {
  const cat = categories.find(c => c.id === activeCat.value)
  return cat?.cards || []
})

function selectCat(catId: string) {
  activeCat.value = catId
  selectedCard.value = null
}

function openCard(card: GreetingCard) {
  selectedCard.value = card
}

function goBack() {
  selectedCard.value = null
}

function copyCard() {
  if (!selectedCard.value) return
  uni.setClipboardData({ data: selectedCard.value.content })
  uni.showToast({ title: '已复制祝福语', icon: 'success' })
}

function shareCard() {
  if (!selectedCard.value) return
  // #ifdef MP-WEIXIN
  uni.shareAppMessage({
    title: selectedCard.value.title,
    path: '/pages/tools/greeting-card/greeting-card',
  })
  // #endif
}
</script>

<template>
  <view class="page">
    <!-- ===== Header Banner ===== -->
    <view v-if="!selectedCard" class="banner">
      <view class="banner-bg" />
      <text class="banner-icon">💌</text>
      <text class="banner-title">祝福贺卡</text>
      <text class="banner-desc">用心传递每一份祝福</text>
      <view class="banner-stats">
        <view class="stat">
          <text class="stat-num">{{ greetingCategories.length }}</text>
          <text class="stat-label">分类</text>
        </view>
        <view class="stat">
          <text class="stat-num">{{ greetingCategories.reduce((s, c) => s + c.cards.length, 0) }}</text>
          <text class="stat-label">模板</text>
        </view>
      </view>
    </view>

    <!-- ===== Category Tabs ===== -->
    <scroll-view v-if="!selectedCard" scroll-x class="cat-scroll" :show-scrollbar="false">
      <view class="cat-row">
        <view v-for="cat in categories" :key="cat.id"
          class="cat-chip" :class="{ active: activeCat === cat.id }"
          @tap="selectCat(cat.id)">
          <text class="cat-chip-icon">{{ cat.icon }}</text>
          <text class="cat-chip-name">{{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- ===== Card List ===== -->
    <view v-if="!selectedCard" class="card-list">
      <view v-for="card in currentCards" :key="card.id"
        class="gcard" :style="{ background: card.bg }"
        @tap="openCard(card)">
        <view class="gcard-inner">
          <text class="gcard-title">{{ card.title }}</text>
          <text class="gcard-preview">{{ card.content.slice(0, 60) }}...</text>
          <view class="gcard-tags">
            <text v-for="tag in card.tags.slice(0, 2)" :key="tag" class="gcard-tag">{{ tag }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- ===== Card Detail ===== -->
    <view v-if="selectedCard" class="detail">
      <view class="detail-header">
        <text class="detail-back" @tap="goBack">← 返回</text>
      </view>

      <view class="detail-card" :style="{ background: selectedCard.bg }">
        <view class="detail-card-inner">
          <text class="detail-card-title">{{ selectedCard.title }}</text>
          <text class="detail-card-content">{{ selectedCard.content }}</text>
        </view>
      </view>

      <view class="detail-actions">
        <view class="dact dact--share" @tap="shareCard">
          <text>📤 分享给朋友</text>
        </view>
        <view class="dact dact--copy" @tap="copyCard">
          <text>📋 复制祝福语</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

/* ===== Banner ===== */
.banner { position: relative; padding: 48rpx 32rpx 36rpx; overflow: hidden; }
.banner-bg { position: absolute; top: -80rpx; left: -80rpx; right: -80rpx; bottom: 0; background: linear-gradient(160deg, #667eea 0%, #764ba2 100%); border-radius: 0 0 60rpx 60rpx; }
.banner-icon { position: relative; font-size: 64rpx; display: block; margin-bottom: 12rpx; }
.banner-title { position: relative; font-size: 44rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 8rpx; }
.banner-desc { position: relative; font-size: 26rpx; color: rgba(255,255,255,0.7); display: block; margin-bottom: 28rpx; }
.banner-stats { position: relative; display: flex; gap: 48rpx; }
.stat { display: flex; flex-direction: column; }
.stat-num { font-size: 40rpx; font-weight: 700; color: #fff; }
.stat-label { font-size: 22rpx; color: rgba(255,255,255,0.6); margin-top: 4rpx; }

/* ===== Category Tabs ===== */
.cat-scroll { white-space: nowrap; padding: 24rpx; background: #fff; margin: -24rpx 24rpx 0; border-radius: 20rpx; position: relative; z-index: 2; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06); }
.cat-row { display: inline-flex; gap: 16rpx; }
.cat-chip { display: inline-flex; flex-direction: column; align-items: center; padding: 16rpx 28rpx; border-radius: 16rpx; background: #F5F7FA; }
.active { background: #667eea; }
.cat-chip-icon { font-size: 32rpx; }
.cat-chip-name { font-size: 22rpx; color: #999; margin-top: 6rpx; }
.active .cat-chip-name { color: rgba(255,255,255,0.8); }

/* ===== Card Grid ===== */
.card-list { padding: 32rpx 24rpx; display: flex; flex-wrap: wrap; gap: 20rpx; }
.gcard { width: 340rpx; border-radius: 20rpx; overflow: hidden; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1); }
.gcard:active { transform: scale(0.97); }
.gcard-inner { padding: 32rpx 24rpx 24rpx; min-height: 220rpx; display: flex; flex-direction: column; }
.gcard-title { font-size: 32rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 12rpx; }
.gcard-preview { font-size: 24rpx; color: rgba(255,255,255,0.8); line-height: 1.5; flex: 1; display: block; }
.gcard-tags { display: flex; gap: 8rpx; margin-top: 16rpx; }
.gcard-tag { font-size: 20rpx; color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.2); padding: 4rpx 12rpx; border-radius: 999rpx; }

/* ===== Detail ===== */
.detail { min-height: 100vh; }
.detail-header { padding: 24rpx; }
.detail-back { font-size: 26rpx; color: #667eea; }
.detail-card { margin: 0 24rpx; border-radius: 24rpx; overflow: hidden; box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.15); }
.detail-card-inner { padding: 48rpx 32rpx; min-height: 500rpx; }
.detail-card-title { font-size: 40rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 32rpx; text-align: center; }
.detail-card-content { font-size: 30rpx; color: #fff; line-height: 2; white-space: pre-wrap; display: block; }

.detail-actions { display: flex; gap: 20rpx; padding: 32rpx 24rpx; }
.dact { flex: 1; padding: 22rpx; border-radius: 999rpx; text-align: center; }
.dact text { font-size: 28rpx; font-weight: 600; }
.dact--share { background: #F5F7FA; }
.dact--share text { color: #667eea; }
.dact--copy { background: #667eea; }
.dact--copy text { color: #fff; }
</style>
