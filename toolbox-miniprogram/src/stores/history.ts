import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface HistoryEntry {
  id: string
  toolId: string
  type: 'voice' | 'ocr' | 'copywriting' | 'image'
  title: string
  summary: string
  data: Record<string, any>
  createdAt: number
  favorited: boolean
}

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([])

  function addEntry(entry: HistoryEntry) {
    entries.value.unshift(entry)
  }

  function removeEntry(id: string) {
    entries.value = entries.value.filter(e => e.id !== id)
  }

  function getEntry(id: string): HistoryEntry | undefined {
    return entries.value.find(e => e.id === id)
  }

  function entriesByType(type: HistoryEntry['type']): HistoryEntry[] {
    return entries.value.filter(e => e.type === type)
  }

  function toggleFavorite(id: string) {
    const entry = entries.value.find(e => e.id === id)
    if (entry) entry.favorited = !entry.favorited
  }

  function clearAll() {
    entries.value = []
  }

  function recentEntries(limit = 20): HistoryEntry[] {
    return entries.value.slice(0, limit)
  }

  return { entries, addEntry, removeEntry, getEntry, entriesByType, toggleFavorite, clearAll, recentEntries }
}, {
  persist: true,
})
