<script setup lang="ts">
import { ref, computed } from 'vue'
import { copywritingCategories, type CopywritingTemplate } from '@/data/copywritingTemplates'

const activeCategory = ref(copywritingCategories[0].id)
const selectedTemplate = ref<CopywritingTemplate | null>(null)
const variables = ref<Record<string, string>>({})

const categories = copywritingCategories

const currentTemplates = computed(() => {
  const cat = categories.find(c => c.id === activeCategory.value)
  return cat?.templates || []
})

function selectTemplate(tmpl: CopywritingTemplate) {
  selectedTemplate.value = tmpl
  variables.value = {}
  for (const v of tmpl.variables) {
    variables.value[v.key] = ''
  }
}

function goGenerate() {
  if (!selectedTemplate.value) return
  const params = encodeURIComponent(JSON.stringify({
    template: selectedTemplate.value,
    variables: variables.value,
  }))
  uni.navigateTo({ url: '/pages/tools/copywriting/generator?data=' + params })
}

function goBack() {
  selectedTemplate.value = null
}
</script>

<template>
  <view class="page">
    <!-- Category tabs -->
    <scroll-view scroll-x class="cat-scroll" :show-scrollbar="false">
      <view class="cat-row">
        <view v-for="cat in categories" :key="cat.id"
          class="cat-item" :class="{ active: activeCategory === cat.id }"
          @tap="activeCategory = cat.id; selectedTemplate = null">
          <text class="cat-icon">{{ cat.icon }}</text>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- Template List -->
    <view v-if="!selectedTemplate" class="tmpl-list">
      <view v-for="tmpl in currentTemplates" :key="tmpl.id"
        class="tmpl-card" @tap="selectTemplate(tmpl)">
        <text class="tmpl-name">{{ tmpl.name }}</text>
        <text class="tmpl-desc">{{ tmpl.description }}</text>
      </view>
    </view>

    <!-- Variable Input -->
    <view v-else class="var-section">
      <view class="var-header" @tap="goBack">
        <text class="var-back">← 返回</text>
      </view>
      <text class="var-title">{{ selectedTemplate.name }}</text>
      <view v-for="v in selectedTemplate.variables" :key="v.key" class="var-group">
        <text class="var-label">{{ v.label }}</text>
        <input class="var-input" v-model="variables[v.key]" :placeholder="v.placeholder" />
      </view>
      <view class="var-btn" @tap="goGenerate">
        <text>生成文案</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }

.cat-scroll { white-space: nowrap; background: #fff; padding: 16rpx 24rpx; border-bottom: 1rpx solid #F2F4F6; }
.cat-row { display: inline-flex; gap: 24rpx; }
.cat-item { display: inline-flex; flex-direction: column; align-items: center; padding: 8rpx 0; }
.cat-icon { font-size: 36rpx; }
.cat-name { font-size: 22rpx; color: #999; margin-top: 4rpx; }
.active .cat-name { color: #4A90D9; font-weight: 600; }

.tmpl-list { padding: 24rpx; }
.tmpl-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; box-shadow: 0 2rpx 16rpx rgba(0,0,0,0.04); }
.tmpl-name { font-size: 30rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 8rpx; }
.tmpl-desc { font-size: 26rpx; color: #999; }

.var-section { padding: 24rpx; }
.var-header { margin-bottom: 24rpx; }
.var-back { font-size: 26rpx; color: #4A90D9; }
.var-title { font-size: 36rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 32rpx; }
.var-group { margin-bottom: 24rpx; }
.var-label { font-size: 26rpx; color: #5A5A5A; display: block; margin-bottom: 8rpx; }
.var-input { background: #fff; border-radius: 12rpx; padding: 16rpx 24rpx; font-size: 26rpx; color: #1A1A1A; border: 1rpx solid #E8ECF0; }
.var-btn { background: #4A90D9; border-radius: 999rpx; padding: 16rpx; text-align: center; margin-top: 16rpx; }
.var-btn text { color: #fff; font-size: 30rpx; font-weight: 600; }
</style>
