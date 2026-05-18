<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('工具集 App 启动')
})
</script>

<style lang="scss">
@import '@/uni.scss';

page {
  background-color: $color-bg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  color: $color-text;
  font-size: $font-md;
  -webkit-font-smoothing: antialiased;
}
</style>
