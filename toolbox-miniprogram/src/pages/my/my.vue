<script setup lang="ts">
import { ref } from 'vue'
import { useRecentlyUsedStore } from '@/stores/recentlyUsed'
import { useHistoryStore } from '@/stores/history'

const recentlyUsedStore = useRecentlyUsedStore()
const historyStore = useHistoryStore()
const cloudEnvId = ref(uni.getStorageSync('cloudEnvId') || '')
const cloudStatus = ref<'未配置' | '已连接' | '配置中'>('未配置')

// Check cloud status on load
// #ifdef MP-WEIXIN
try {
  if (cloudEnvId.value && (wx as any).cloud) {
    (wx as any).cloud.init({ env: cloudEnvId.value, traceUser: true })
    cloudStatus.value = '已连接'
  }
} catch { cloudStatus.value = '未配置' }
// #endif

function saveCloudEnv() {
  if (!cloudEnvId.value.trim()) {
    uni.showToast({ title: '请输入云环境ID', icon: 'none' })
    return
  }
  // #ifdef MP-WEIXIN
  try {
    (wx as any).cloud.init({ env: cloudEnvId.value.trim(), traceUser: true })
    uni.setStorageSync('cloudEnvId', cloudEnvId.value.trim())
    cloudStatus.value = '已连接'
    uni.showToast({ title: '云环境已连接', icon: 'success' })
  } catch {
    uni.showToast({ title: '连接失败，请检查环境ID', icon: 'none' })
  }
  // #endif
}

function clearRecent() {
  uni.showModal({
    title: '确认清除',
    success: (res: any) => { if (res.confirm) recentlyUsedStore.clearRecent() },
  })
}
function clearHistory() {
  uni.showModal({
    title: '确认清除',
    success: (res: any) => { if (res.confirm) historyStore.clearAll() },
  })
}
function clearAll() {
  uni.showModal({
    title: '清除全部缓存',
    success: (res: any) => {
      if (res.confirm) { uni.clearStorageSync(); uni.showToast({ title: '已清除', icon: 'success' }) }
    },
  })
}
</script>

<template>
  <view class="page">
    <view class="header">
      <view class="avatar"><text>👤</text></view>
      <text class="nickname">工具集用户</text>
      <text class="version">v1.0.0</text>
    </view>

    <view class="card">
      <text class="card-title">云环境配置</text>
      <view class="row">
        <view class="row-left">
          <text class="row-label">环境状态</text>
          <text class="row-status" :style="{ color: cloudStatus === '已连接' ? '#5B9E8A' : '#999' }">{{ cloudStatus === '已连接' ? '✅ 已连接' : '⚠️ 未配置' }}</text>
        </view>
      </view>
      <view class="row-input">
        <input class="env-input" v-model="cloudEnvId" placeholder="输入云环境ID，如: cloud-xxx" />
      </view>
      <view class="row" @tap="saveCloudEnv">
        <text class="row-label" style="color: #4A90D9; font-weight: 600;">保存并连接</text>
        <text class="row-arrow">›</text>
      </view>
    </view>

    <view class="card">
      <text class="card-title">数据管理</text>
      <view class="row" @tap="clearRecent">
        <text class="row-label">清除最近使用</text>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @tap="clearHistory">
        <text class="row-label">清除使用历史</text>
        <text class="row-arrow">›</text>
      </view>
      <view class="row" @tap="clearAll">
        <text class="row-label">清除全部缓存</text>
        <text class="row-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

.header {
  display: flex; flex-direction: column; align-items: center;
  padding: 64rpx 24rpx 48rpx;
  background: linear-gradient(160deg, #3A7BD5, #4A90D9);
}
.avatar { width: 100rpx; height: 100rpx; border-radius: 50%; background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; margin-bottom: 16rpx; }
.avatar text { font-size: 48rpx; }
.nickname { font-size: 36rpx; font-weight: 600; color: #fff; margin-bottom: 4rpx; }
.version { font-size: 22rpx; color: rgba(255,255,255,0.7); }

.card { background: #fff; margin: 16rpx 24rpx; border-radius: 20rpx; overflow: hidden; }
.card-title { font-size: 22rpx; color: #999; padding: 16rpx 24rpx; display: block; }
.row { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-top: 1rpx solid #F2F4F6; }
.row-left { display: flex; flex-direction: column; }
.row-label { font-size: 26rpx; color: #1A1A1A; }
.row-status { font-size: 22rpx; margin-top: 4rpx; }
.row-arrow { font-size: 32rpx; color: #999; }
.row-input { padding: 16rpx 24rpx; border-top: 1rpx solid #F2F4F6; }
.env-input { background: #F5F7FA; border-radius: 12rpx; padding: 16rpx 20rpx; font-size: 26rpx; color: #1A1A1A; width: 100%; box-sizing: border-box; }
</style>
