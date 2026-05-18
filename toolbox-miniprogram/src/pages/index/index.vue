<script setup lang="ts">
import { ref, computed } from 'vue'
import { getEnabledTools, categoryLabels, type ToolDefinition } from '@/data/tools'
import { useRecentlyUsedStore } from '@/stores/recentlyUsed'

const recentlyUsedStore = useRecentlyUsedStore()
const searchText = ref('')
const allTools = getEnabledTools()

const recentTools = computed(() => recentlyUsedStore.getRecentTools())

const filteredTools = computed(() => {
  if (!searchText.value) return allTools
  const kw = searchText.value.toLowerCase()
  return allTools.filter(t => t.name.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw))
})

const groupedTools = computed(() => {
  const groups: { category: string; tools: typeof allTools }[] = []
  const seen = new Set<string>()
  for (const t of filteredTools.value) {
    if (!seen.has(t.category)) {
      seen.add(t.category)
      groups.push({ category: t.category, tools: filteredTools.value.filter(x => x.category === t.category) })
    }
  }
  return groups
})

function getCatLabel(cat: string): string {
  return (categoryLabels as Record<string, string>)[cat] || cat
}

function onSearchInput(e: any) {
  searchText.value = e.detail.value
}

function openTool(tool: ToolDefinition) {
  recentlyUsedStore.recordUse(tool.id)
  uni.navigateTo({ url: tool.route })
}
</script>

<template>
  <view class="home">
    <text class="title">工具集</text>
    <view class="search-bar">
      <text class="search-icon">🔍</text>
      <input class="search-input" placeholder="搜索工具..." @input="onSearchInput" />
    </view>
    <!-- Recently Used -->
    <view v-if="!searchText && recentTools.length > 0" class="section">
      <text class="section-title">最近使用</text>
      <scroll-view scroll-x class="recent-scroll" :show-scrollbar="false">
        <view class="recent-row">
          <view v-for="tool in recentTools" :key="tool.id" class="tool-sm" @tap="openTool(tool)">
            <text class="tool-sm-icon">{{ tool.icon }}</text>
            <text class="tool-sm-name">{{ tool.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Category Grids -->
    <view v-for="group in groupedTools" :key="group.category" class="section">
      <text class="section-title">{{ getCatLabel(group.category) }}</text>
      <view class="grid">
        <view v-for="tool in group.tools" :key="tool.id" class="tool-card" @tap="openTool(tool)">
          <view class="card-icon-wrap"><text class="card-icon">{{ tool.icon }}</text></view>
          <text class="card-name">{{ tool.name }}</text>
          <text class="card-desc">{{ tool.description }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.home { min-height: 100vh; background: #F5F7FA; padding: 24rpx 24rpx 40rpx; }
.title { font-size: 44rpx; font-weight: 700; color: #4A90D9; display: block; margin-bottom: 24rpx; }

.search-bar {
  display: flex; align-items: center; background: #fff;
  padding: 16rpx 24rpx; margin-bottom: 32rpx;
  border-radius: 999rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
}
.search-icon { font-size: 30rpx; margin-right: 16rpx; }
.search-input { flex: 1; font-size: 26rpx; background: transparent; }

.section { margin-bottom: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 16rpx; }

.recent-scroll { white-space: nowrap; }
.recent-row { display: inline-flex; gap: 16rpx; }
.tool-sm {
  display: inline-flex; flex-direction: column; align-items: center;
  background: #fff; border-radius: 20rpx; padding: 16rpx;
  width: 160rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); flex-shrink: 0;
}
.tool-sm-icon { font-size: 36rpx; }
.tool-sm-name { font-size: 22rpx; color: #1A1A1A; margin-top: 4rpx; }

.grid { display: flex; flex-wrap: wrap; gap: 20rpx; }
.tool-card {
  width: 210rpx;
  background: #fff; border-radius: 20rpx; padding: 24rpx;
  text-align: center; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04);
}
.tool-card:active { transform: scale(0.96); }
.card-icon-wrap {
  width: 80rpx; height: 80rpx; border-radius: 20rpx;
  background: rgba(74,144,217,0.08); display: flex;
  align-items: center; justify-content: center;
  margin: 0 auto 16rpx;
}
.card-icon { font-size: 40rpx; }
.card-name { font-size: 26rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 4rpx; }
.card-desc { font-size: 22rpx; color: #999; line-height: 1.4; display: block; }
</style>
