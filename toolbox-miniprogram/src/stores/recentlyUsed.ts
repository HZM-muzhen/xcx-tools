import { defineStore } from 'pinia'
import { ref } from 'vue'
import { toolRegistry, type ToolDefinition } from '@/data/tools'

const MAX_ITEMS = 10

export const useRecentlyUsedStore = defineStore('recentlyUsed', () => {
  const toolIds = ref<string[]>([])

  function recordUse(toolId: string) {
    toolIds.value = [toolId, ...toolIds.value.filter(id => id !== toolId)].slice(0, MAX_ITEMS)
  }

  function getRecentTools(): ToolDefinition[] {
    return toolIds.value
      .map(id => toolRegistry.find(t => t.id === id))
      .filter((t): t is ToolDefinition => t !== undefined)
  }

  function clearRecent() {
    toolIds.value = []
  }

  return { toolIds, recordUse, getRecentTools, clearRecent }
}, {
  persist: true,
})
