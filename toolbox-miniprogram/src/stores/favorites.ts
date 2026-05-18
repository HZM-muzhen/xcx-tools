import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFavoritesStore = defineStore('favorites', () => {
  const favoriteIds = ref<string[]>([])

  function toggle(id: string) {
    const idx = favoriteIds.value.indexOf(id)
    if (idx > -1) {
      favoriteIds.value.splice(idx, 1)
    } else {
      favoriteIds.value.unshift(id)
    }
  }

  function isFav(id: string): boolean {
    return favoriteIds.value.includes(id)
  }

  function remove(id: string) {
    favoriteIds.value = favoriteIds.value.filter(fid => fid !== id)
  }

  return { favoriteIds, toggle, isFav, remove }
}, {
  persist: true,
})
