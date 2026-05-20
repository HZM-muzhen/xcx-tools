<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Song {
  id: string; name: string; artists: string; album: string
  cover: string; platform: string; platformName: string; duration: number
}

const platforms = [
  { key: 'all', name: '全部平台' },
  { key: 'netease', name: '网易云' },
  { key: 'qq', name: 'QQ音乐' },
  { key: 'kugou', name: '酷狗' },
  { key: 'kuwo', name: '酷我' },
]

const activePlatform = ref('all')
const keyword = ref('')
const songs = ref<Song[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)

// 当前来源标签
const platformLabel = computed(() => {
  const p = platforms.find(t => t.key === activePlatform.value)
  return p ? p.name : '全部平台'
})

// Player state
const currentSong = ref<Song | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isDragging = ref(false)
const songsList = ref<Song[]>([])
const playIndex = ref(-1)
const bgAudio = ref<any>(null)

// Playlist
const userId = ref('')
const playlists = ref<any[]>([])
const showPlaylists = ref(false)

// ===== Platform switching triggers re-search =====
watch(activePlatform, () => {
  if (keyword.value.trim()) search()
})

// ===== Background Audio Manager =====
function initBgAudio() {
  // #ifdef MP-WEIXIN
  if (bgAudio.value) return
  const wxa = (wx as any)
  bgAudio.value = wxa.getBackgroundAudioManager()
  bgAudio.value.onPlay(() => { isPlaying.value = true })
  bgAudio.value.onPause(() => { isPlaying.value = false })
  bgAudio.value.onStop(() => { isPlaying.value = false; currentTime.value = 0 })
  bgAudio.value.onEnded(() => { playNext() })
  bgAudio.value.onTimeUpdate(() => {
    if (!isDragging.value && bgAudio.value) currentTime.value = bgAudio.value.currentTime || 0
  })
  bgAudio.value.onCanplay(() => {
    if (bgAudio.value) duration.value = bgAudio.value.duration || 0
  })
  bgAudio.value.onError((e: any) => {
    isPlaying.value = false
    const msg = e?.errMsg || ''
    if (msg.includes('src is invalid') || msg.includes('network')) {
      uni.showToast({ title: '播放源无效，可能版权限制', icon: 'none' })
    }
  })
  bgAudio.value.ontimeupdate = bgAudio.value.onTimeUpdate
  // #endif
}

function playSong(song: Song) {
  initBgAudio()
  currentSong.value = song
  currentTime.value = 0
  duration.value = song.duration / 1000 || 0

  let url = ''
  if (song.platform === 'qq') url = getQQUrl(song.id)
  else if (song.platform === 'kugou') url = getKugouUrl(song.id)
  else if (song.platform === 'kuwo') url = getKuwoUrl(song.id)
  else url = getNeteaseUrl(song.id)

  if (!url) { isPlaying.value = false; uni.showToast({ title: '该歌曲暂无播放源', icon: 'none' }); return }

  // #ifdef MP-WEIXIN
  const mgr = bgAudio.value
  mgr.title = song.name
  mgr.epname = song.album || song.name
  mgr.singer = song.artists
  mgr.coverImgUrl = song.cover || ''
  mgr.src = url.replace(/^http:/, 'https:')
  // #endif
}

function playIndexSong(idx: number) {
  if (idx < 0 || idx >= songsList.value.length) return
  playIndex.value = idx
  playSong(songsList.value[idx])
}

function playNext() {
  if (playIndex.value < songsList.value.length - 1) playIndexSong(playIndex.value + 1)
  else { isPlaying.value = false; uni.showToast({ title: '已是最后一首', icon: 'none' }) }
}

function playPrev() {
  if (playIndex.value > 0) playIndexSong(playIndex.value - 1)
}

function togglePlay() {
  if (!bgAudio.value || !currentSong.value) return
  if (isPlaying.value) bgAudio.value.pause()
  else bgAudio.value.play()
}

function stopPlay() {
  if (bgAudio.value) bgAudio.value.stop()
  isPlaying.value = false; currentSong.value = null; currentTime.value = 0
}

function onProgressTouch(e: any) {
  isDragging.value = true
  const t = e.touches?.[0] || e.changedTouches?.[0] || e.detail
  if (!t || !duration.value) return
  const target = e.currentTarget
  const rect = { left: 0, width: 1 }
  // #ifdef MP-WEIXIN
  const query = uni.createSelectorQuery()
  query.select('.progress-track').boundingClientRect((res: any) => {
    if (res) {
      const pct = Math.max(0, Math.min(1, (t.clientX - res.left) / res.width))
      currentTime.value = pct * duration.value
    }
  }).exec()
  // #endif
}

function onProgressEnd() {
  if (bgAudio.value && duration.value) {
    bgAudio.value.seek(currentTime.value)
  }
  isDragging.value = false
}

// ===== Platform Search APIs =====
function neteaseSearch(kw: string): Promise<Song[]> {
  return new Promise((resolve) => {
    uni.request({
      url: 'https://music.163.com/api/search/get',
      data: { s: kw, type: 1, limit: 20, offset: 0 },
      success: (res: any) => {
        if (res.data?.code === 200 && res.data.result?.songs) {
          resolve(res.data.result.songs.map((s: any) => ({
            id: String(s.id), name: s.name,
            artists: (s.artists || []).map((a: any) => a.name).join(' / '),
            album: s.album?.name || '',
            cover: s.album?.picUrl || '',
            platform: 'netease', platformName: '网易云', duration: s.duration || 0,
          })))
        } else resolve([])
      },
      fail: () => resolve([]),
    })
  })
}

function qqSearch(kw: string): Promise<Song[]> {
  return new Promise((resolve) => {
    uni.request({
      url: 'https://c.y.qq.com/soso/fcgi-bin/client_search_cp',
      data: { w: kw, n: 20, format: 'json', p: 1, remoteplace: 'txt.mqq.all' },
      success: (res: any) => {
        if (res.data?.code === 0 && res.data.data?.song?.list) {
          resolve(res.data.data.song.list.map((s: any) => ({
            id: String(s.songmid || s.id), name: s.songname || s.name,
            artists: (s.singer || []).map((a: any) => a.name).join(' / '),
            album: s.albumname || '',
            cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
            platform: 'qq', platformName: 'QQ音乐', duration: (s.interval || 0) * 1000,
          })))
        } else resolve([])
      },
      fail: () => resolve([]),
    })
  })
}

function kugouSearch(kw: string): Promise<Song[]> {
  return new Promise((resolve) => {
    uni.request({
      url: 'http://mobilecdn.kugou.com/api/v3/search/song',
      data: { format: 'json', keyword: kw, page: 1, pagesize: 20 },
      success: (res: any) => {
        if (res.data?.data?.info) {
          resolve(res.data.data.info.map((s: any) => ({
            id: s.hash || '', name: s.songname || '',
            artists: s.singername || '', album: s.album_name || '',
            cover: s.hash ? `https://imge.kugou.com/stdmusic/${s.hash}.png` : '',
            platform: 'kugou', platformName: '酷狗', duration: (s.duration || 0) * 1000,
          })).filter((s: Song) => s.id))
        } else resolve([])
      },
      fail: () => resolve([]),
    })
  })
}

function kuwoSearch(kw: string): Promise<Song[]> {
  return new Promise((resolve) => {
    uni.request({
      url: 'http://search.kuwo.cn/r.s',
      data: { all: kw, pn: 0, rn: 20, ft: 'music', format: 'json' },
      success: (res: any) => {
        if (Array.isArray(res.data)) {
          resolve(res.data.map((s: any) => ({
            id: String(s.musicrid || s.id || '').replace('MUSIC_', ''),
            name: s.name || '', artists: s.artist || '', album: s.album || '',
            cover: s.pic || '', platform: 'kuwo', platformName: '酷我',
            duration: (s.duration || 0) * 1000,
          })).filter((s: Song) => s.id))
        } else resolve([])
      },
      fail: () => resolve([]),
    })
  })
}

// ===== Play URL APIs =====
function getNeteaseUrl(id: string): string { return '' }
function getQQUrl(id: string): string { return '' }
function getKugouUrl(id: string): string { return '' }
function getKuwoUrl(id: string): string { return '' }

// 异步获取播放地址
async function fetchAndPlay(song: Song) {
  let url = ''
  if (song.platform === 'qq') {
    url = await new Promise<string>(resolve => {
      uni.request({
        url: 'https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg',
        data: { songmid: song.id, format: 'json' },
        success: (res: any) => {
          const purl = res.data?.data?.[0]?.purl || res.data?.data?.[0]?.file?.purl || ''
          resolve(purl ? `https://dl.stream.qqmusic.qq.com/${purl}` : '')
        },
        fail: () => resolve(''),
      })
    })
  } else if (song.platform === 'kugou') {
    url = await new Promise<string>(resolve => {
      uni.request({
        url: 'http://m.kugou.com/app/i/getSongInfo.php',
        data: { cmd: 'playInfo', hash: song.id },
        success: (res: any) => resolve((res.data?.url || '').replace(/^http:/, 'https:')),
        fail: () => resolve(''),
      })
    })
  } else if (song.platform === 'kuwo') {
    url = await new Promise<string>(resolve => {
      uni.request({
        url: 'http://www.kuwo.cn/url',
        data: { format: 'mp3', rid: song.id, type: 'convert_url3' },
        success: (res: any) => resolve(res.data?.url || ''),
        fail: () => resolve(''),
      })
    })
  } else {
    url = await new Promise<string>(resolve => {
      uni.request({
        url: 'https://music.163.com/api/song/enhance/player/url',
        data: { ids: `[${song.id}]`, br: 320000 },
        success: (res: any) => resolve(res.data?.data?.[0]?.url || ''),
        fail: () => resolve(''),
      })
    })
  }

  if (!url) { isPlaying.value = false; uni.showToast({ title: '暂无播放源', icon: 'none' }); return }

  // #ifdef MP-WEIXIN
  const mgr = bgAudio.value
  // 先停止当前播放，再切歌
  try { mgr.stop() } catch {}
  // 延迟确保 stop 完成后再设置新 src
  setTimeout(() => {
    mgr.title = song.name
    mgr.epname = song.album || song.name
    mgr.singer = song.artists
    mgr.coverImgUrl = song.cover || ''
    mgr.src = url.replace(/^http:/, 'https:')
  }, 100)
  // #endif
}

// Rewrite playSong to use async URL fetch
async function _playSong(song: Song) {
  initBgAudio()
  currentSong.value = song
  currentTime.value = 0
  duration.value = song.duration / 1000 || 0
  await fetchAndPlay(song)
}

// ===== Search =====
async function search() {
  if (!keyword.value.trim()) return
  isSearching.value = true; hasSearched.value = true
  songs.value = []
  const kw = keyword.value.trim()
  const results: Song[] = []
  const ap = activePlatform.value

  if (ap === 'all' || ap === 'netease') results.push(...(await neteaseSearch(kw)))
  if (ap === 'all' || ap === 'qq') results.push(...(await qqSearch(kw)))
  if (ap === 'all' || ap === 'kugou') results.push(...(await kugouSearch(kw)))
  if (ap === 'all' || ap === 'kuwo') results.push(...(await kuwoSearch(kw)))

  songs.value = results; songsList.value = results; playIndex.value = -1
  isSearching.value = false
  if (results.length === 0) uni.showToast({ title: '未搜索到歌曲', icon: 'none' })
}

// ===== Playlist =====
function loadPlaylists() {
  if (!userId.value.trim()) return
  uni.showLoading({ title: '加载中...' })
  uni.request({
    url: 'https://music.163.com/api/user/playlist',
    data: { uid: userId.value.trim(), limit: 30 },
    success: (res: any) => {
      uni.hideLoading()
      if (res.data?.code === 200 && res.data.playlist) {
        playlists.value = res.data.playlist.map((p: any) => ({
          id: String(p.id), name: p.name, cover: p.coverImgUrl || '',
          count: p.trackCount || 0, creator: p.creator?.nickname || '',
        }))
        showPlaylists.value = true
      } else uni.showToast({ title: '未找到歌单', icon: 'none' })
    },
    fail: () => { uni.hideLoading(); uni.showToast({ title: '请求失败', icon: 'none' }) },
  })
}

function openPlaylist(p: any) {
  uni.showLoading({ title: '加载歌单...' })
  uni.request({
    url: 'https://music.163.com/api/playlist/detail',
    data: { id: p.id },
    success: (res: any) => {
      uni.hideLoading()
      if (res.data?.code === 200 && res.data.result) {
        const pl = res.data.result
        songs.value = (pl.tracks || []).map((s: any) => ({
          id: String(s.id), name: s.name,
          artists: (s.ar || []).map((a: any) => a.name).join(' / '),
          album: s.al?.name || '', cover: s.al?.picUrl || '',
          platform: 'netease', platformName: '网易云', duration: s.dt || 0,
        }))
        songsList.value = songs.value; playIndex.value = -1
        hasSearched.value = true; showPlaylists.value = false
        activePlatform.value = 'netease'
      }
    },
    fail: () => { uni.hideLoading(); uni.showToast({ title: '加载失败', icon: 'none' }) },
  })
}

// ===== Format =====
function fmtTime(s: number): string {
  if (!s || s < 0) return '00:00'
  const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
  return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0')
}

function fmtDur(ms: number): string {
  const s = Math.floor(ms / 1000); const m = Math.floor(s / 60); const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

function onInput(e: any) { keyword.value = e.detail.value }
</script>

<template>
  <view class="page" :class="{ 'has-player': currentSong }">
    <!-- ===== Header ===== -->
    <view class="header">
      <text class="header-title">🎶 云音乐</text>
    </view>

    <!-- ===== Platform Tabs ===== -->
    <scroll-view scroll-x class="plat-scroll" :show-scrollbar="false">
      <view class="plat-row">
        <view v-for="p in platforms" :key="p.key"
          class="plat-chip" :class="{ active: activePlatform === p.key }"
          @tap="activePlatform = p.key">
          <text>{{ p.name }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- ===== Search ===== -->
    <view class="search-bar">
      <input class="search-input" :value="keyword" placeholder="搜索歌曲 / 歌手 / 专辑..." @input="onInput" @confirm="search" />
      <view class="search-btn" @tap="search"><text>搜索</text></view>
    </view>

    <!-- ===== Playlist ===== -->
    <view class="ple-box">
      <text class="ple-label">🎵 网易云歌单</text>
      <view class="ple-row">
        <input class="ple-input" v-model="userId" placeholder="输入网易云用户ID..." />
        <view class="ple-btn" @tap="loadPlaylists"><text>查看</text></view>
      </view>
    </view>

    <!-- ===== Results ===== -->
    <view v-if="isSearching" class="loading"><text>搜索中...</text></view>

    <view v-if="songs.length > 0" class="song-list">
      <view class="list-header">
        <text class="list-title">「{{ platformLabel }}」搜索结果</text>
        <text class="list-count">{{ songs.length }} 首</text>
      </view>
      <view v-for="(song, idx) in songs" :key="song.id + song.platform" class="song-card"
        :class="{ active: playIndex === idx && currentSong?.id === song.id }"
        @tap="playIndex = idx; _playSong(song)">
        <image class="song-cover" :src="song.cover" mode="aspectFill" />
        <view class="song-body">
          <text class="song-name">{{ song.name }}</text>
          <text class="song-artist">{{ song.artists }}</text>
          <text class="song-album">{{ song.album }}</text>
        </view>
        <view class="song-right">
          <text class="song-platform">{{ song.platformName }}</text>
          <text v-if="song.duration" class="song-dur">{{ fmtDur(song.duration) }}</text>
          <text class="song-play-icon">{{ playIndex === idx && isPlaying ? '🔊' : '▶️' }}</text>
        </view>
      </view>
    </view>

    <view v-if="hasSearched && songs.length === 0 && !isSearching" class="empty">
      <text class="empty-icon">🎵</text>
      <text class="empty-text">未搜索到歌曲</text>
    </view>

    <view v-if="!hasSearched" class="hero">
      <text class="hero-icon">🎶</text>
      <text class="hero-title">云音乐</text>
      <text class="hero-desc">聚合网易云·QQ·酷狗·酷我</text>
      <view class="hot-search">
        <text class="hot-label">热门搜索</text>
        <view class="hot-row">
          <text v-for="w in ['周杰伦','林俊杰','陈奕迅','邓紫棋','告五人','Taylor Swift']" :key="w"
            class="hot-chip" @tap="keyword = w; search()">{{ w }}</text>
        </view>
      </view>
    </view>

    <!-- ===== BOTTOM PLAYER ===== -->
    <view v-if="currentSong" class="bottom-player">
      <!-- Progress on top edge -->
      <view class="player-progress" @touchmove="onProgressTouch" @touchend="onProgressEnd">
        <view class="progress-track">
          <view class="progress-fill" :style="{ width: duration ? (currentTime / duration * 100) + '%' : '0%' }" />
        </view>
      </view>

      <view class="player-main">
        <image class="player-cover-sm" :src="currentSong.cover" mode="aspectFill" @tap.stop />
        <view class="player-body" @tap.stop>
          <text class="player-name">{{ currentSong.name }}</text>
          <view class="player-meta">
            <text class="player-artist">{{ currentSong.artists }}</text>
            <text class="player-time">{{ fmtTime(currentTime) }} / {{ fmtTime(duration) }}</text>
          </view>
        </view>
        <view class="player-btns">
          <text class="pbtn" @tap.stop="playPrev">⏮</text>
          <text class="pbtn pbtn-play" @tap.stop="togglePlay">{{ isPlaying ? '⏸' : '▶️' }}</text>
          <text class="pbtn" @tap.stop="playNext">⏭</text>
        </view>
        <text class="pbtn pbtn-close" @tap.stop="stopPlay">✕</text>
      </view>
    </view>

    <!-- Safe bottom -->
    <view :style="{ height: currentSong ? '220rpx' : '40rpx' }" />

    <!-- Playlist Modal -->
    <view v-if="showPlaylists" class="modal" @tap="showPlaylists = false">
      <view class="modal-card" @tap.stop>
        <view class="modal-hd"><text class="modal-title">🎵 歌单列表</text><text class="modal-close" @tap="showPlaylists = false">✕</text></view>
        <scroll-view scroll-y class="modal-body">
          <view v-for="p in playlists" :key="p.id" class="pl-card" @tap="openPlaylist(p)">
            <image class="pl-cover" :src="p.cover" mode="aspectFill" />
            <view class="pl-info">
              <text class="pl-name">{{ p.name }}</text>
              <text class="pl-count">{{ p.count }} 首 · {{ p.creator }}</text>
            </view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page { min-height: 100vh; background: #F5F7FA; }
.has-player { padding-bottom: 0; }

/* Header */
.header { padding: 24rpx 24rpx 12rpx; }
.header-title { font-size: 40rpx; font-weight: 700; color: #1A1A1A; }

/* Platform tabs */
.plat-scroll { white-space: nowrap; padding: 0 24rpx 16rpx; }
.plat-row { display: inline-flex; gap: 12rpx; }
.plat-chip { padding: 10rpx 28rpx; border-radius: 999rpx; background: #fff; font-size: 26rpx; color: #5A5A5A; border: 1rpx solid #E8ECF0; }
.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }

/* Search */
.search-bar { display: flex; gap: 12rpx; padding: 0 24rpx 16rpx; }
.search-input { flex: 1; background: #fff; border-radius: 999rpx; padding: 14rpx 24rpx; font-size: 28rpx; border: 1rpx solid #E8ECF0; }
.search-btn { background: #1a1a2e; border-radius: 999rpx; padding: 14rpx 32rpx; display: flex; align-items: center; }
.search-btn text { color: #fff; font-size: 26rpx; font-weight: 600; }

/* Playlist */
.ple-box { margin: 0 24rpx 16rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; }
.ple-label { font-size: 26rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 12rpx; }
.ple-row { display: flex; gap: 12rpx; }
.ple-input { flex: 1; background: #F5F7FA; border-radius: 999rpx; padding: 12rpx 20rpx; font-size: 26rpx; }
.ple-btn { background: #1a1a2e; border-radius: 999rpx; padding: 12rpx 24rpx; }
.ple-btn text { color: #fff; font-size: 24rpx; }

.loading { text-align: center; padding: 60rpx 0; font-size: 26rpx; color: #999; }

/* Song list */
.song-list { padding: 0 24rpx; }
.list-header { display: flex; justify-content: space-between; align-items: center; padding: 8rpx 4rpx 16rpx; }
.list-title { font-size: 26rpx; font-weight: 600; color: #1A1A1A; }
.list-count { font-size: 22rpx; color: #bbb; }

.song-card { display: flex; align-items: center; gap: 20rpx; background: #fff; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); }
.song-card.active { background: rgba(26,26,46,0.06); }
.song-cover { width: 96rpx; height: 96rpx; border-radius: 12rpx; flex-shrink: 0; background: #F5F7FA; }
.song-body { flex: 1; overflow: hidden; }
.song-name { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.song-artist { font-size: 24rpx; color: #5A5A5A; display: block; margin-top: 4rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.song-album { font-size: 22rpx; color: #bbb; display: block; margin-top: 2rpx; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.song-right { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 4rpx; }
.song-platform { font-size: 20rpx; color: #999; background: #F5F7FA; padding: 2rpx 10rpx; border-radius: 4rpx; }
.song-dur { font-size: 22rpx; color: #ccc; }
.song-play-icon { font-size: 32rpx; }

.empty { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 28rpx; color: #999; }

.hero { display: flex; flex-direction: column; align-items: center; padding: 40rpx 24rpx 0; }
.hero-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.hero-title { font-size: 44rpx; font-weight: 700; color: #1A1A1A; }
.hero-desc { font-size: 26rpx; color: #999; margin: 8rpx 0 32rpx; }
.hot-search { width: 100%; }
.hot-label { font-size: 24rpx; color: #bbb; display: block; margin-bottom: 16rpx; padding-left: 4rpx; }
.hot-row { display: flex; flex-wrap: wrap; gap: 12rpx; }
.hot-chip { padding: 12rpx 24rpx; border-radius: 999rpx; background: #fff; font-size: 26rpx; color: #5A5A5A; border: 1rpx solid #E8ECF0; }

/* ===== Bottom Player ===== */
.bottom-player { position: fixed; bottom: 0; left: 0; right: 0; z-index: 99; background: linear-gradient(135deg, #1a1a2e, #16213e); border-radius: 20rpx 20rpx 0 0; padding: 0 0 20rpx; }

.player-progress { padding: 20rpx 24rpx 8rpx; }
.progress-track { height: 6rpx; background: rgba(255,255,255,0.15); border-radius: 3rpx; position: relative; }
.progress-fill { height: 6rpx; background: linear-gradient(90deg, #4A90D9, #7B68EE); border-radius: 3rpx; transition: width 0.3s; }

.player-main { display: flex; align-items: center; gap: 16rpx; padding: 8rpx 24rpx; }
.player-cover-sm { width: 80rpx; height: 80rpx; border-radius: 12rpx; flex-shrink: 0; background: #333; }
.player-body { flex: 1; overflow: hidden; }
.player-name { font-size: 28rpx; font-weight: 600; color: #fff; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.player-meta { display: flex; justify-content: space-between; align-items: center; margin-top: 4rpx; }
.player-artist { font-size: 22rpx; color: rgba(255,255,255,0.5); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
.player-time { font-size: 20rpx; color: rgba(255,255,255,0.35); font-variant-numeric: tabular-nums; }

.player-btns { display: flex; align-items: center; gap: 20rpx; flex-shrink: 0; }
.pbtn { font-size: 36rpx; color: rgba(255,255,255,0.7); padding: 4rpx; }
.pbtn-play { font-size: 48rpx; color: #fff; }
.pbtn-close { font-size: 24rpx; color: rgba(255,255,255,0.35); padding: 8rpx; margin-left: 4rpx; }

/* Modal */
.modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal-card { width: 100%; max-height: 80vh; background: #fff; border-radius: 28rpx 28rpx 0 0; overflow: hidden; }
.modal-hd { display: flex; justify-content: space-between; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #F2F4F6; }
.modal-title { font-size: 32rpx; font-weight: 700; }
.modal-close { font-size: 36rpx; color: #ccc; padding: 0 8rpx; }
.modal-body { max-height: 65vh; padding: 16rpx 24rpx; }
.pl-card { display: flex; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; align-items: center; }
.pl-cover { width: 100rpx; height: 100rpx; border-radius: 12rpx; flex-shrink: 0; background: #F5F7FA; }
.pl-info { flex: 1; }
.pl-name { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; }
.pl-count { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
</style>
