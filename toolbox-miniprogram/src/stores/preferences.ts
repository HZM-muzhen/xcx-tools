import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePreferencesStore = defineStore('preferences', () => {
  const defaultVoiceLang = ref<'zh_CN' | 'en_US'>('zh_CN')
  const defaultCalculatorTab = ref('mortgage')
  const cloudEnvId = ref('')

  function updatePreferences(partial: Partial<{
    defaultVoiceLang: 'zh_CN' | 'en_US'
    defaultCalculatorTab: string
    cloudEnvId: string
  }>) {
    Object.assign({ defaultVoiceLang, defaultCalculatorTab, cloudEnvId }, partial)
  }

  return { defaultVoiceLang, defaultCalculatorTab, cloudEnvId, updatePreferences }
}, {
  persist: true,
})
