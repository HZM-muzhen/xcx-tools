// 音乐搜索代理云函数 - 对接多个音乐平台 API
const cloud = require('wx-server-sdk')
const https = require('https')
const http = require('http')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// NetEase Cloud Music API
const NETEASE_API = {
  host: 'music.163.com',
  search: '/api/search/get',
  songDetail: '/api/song/detail',
  playlist: '/api/playlist/detail',
  songUrl: '/api/song/enhance/player/url',
  lyric: '/api/song/lyric',
}

// QQ Music API
const QQ_API = {
  host: 'c.y.qq.com',
  search: '/soso/fcgi-bin/client_search_cp',
}

function doRequest(url, options = {}) {
  const isHttps = url.startsWith('https')
  const proto = isHttps ? https : http
  const u = new URL(url)
  return new Promise((resolve, reject) => {
    const req = proto.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.163.com/',
        'Accept': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) })
        } catch {
          resolve({ status: res.statusCode, data })
        }
      })
    })
    req.on('error', reject)
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')) })
    if (options.body) req.write(options.body)
    req.end()
  })
}

// NetEase: 搜索歌曲
async function neteaseSearch(keyword, limit = 20) {
  const url = `https://${NETEASE_API.host}${NETEASE_API.search}?s=${encodeURIComponent(keyword)}&type=1&limit=${limit}&offset=0`
  const res = await doRequest(url)
  if (res.status !== 200 || !res.data || res.data.code !== 200) return []
  return (res.data.result?.songs || []).map(s => ({
    id: String(s.id),
    name: s.name,
    artists: (s.artists || []).map(a => a.name).join(' / '),
    album: s.album?.name || '',
    cover: s.album?.picUrl || s.album?.artist?.img1v1Url || '',
    platform: 'netease',
    platformName: '网易云音乐',
    duration: s.duration || 0,
  }))
}

// NetEase: 获取播放地址
async function neteaseSongUrl(id) {
  const url = `https://${NETEASE_API.host}${NETEASE_API.songUrl}?ids=[${id}]&br=320000`
  const res = await doRequest(url)
  if (res.status !== 200 || !res.data || res.data.code !== 200) return ''
  const song = (res.data.data || [])[0]
  return song?.url || ''
}

// NetEase: 获取歌单
async function neteasePlaylist(uid) {
  // 用用户的歌单列表
  const url = `https://${NETEASE_API.host}/api/user/playlist?uid=${uid}&limit=30`
  const res = await doRequest(url)
  if (res.status !== 200 || !res.data || res.data.code !== 200) return []
  return (res.data.playlist || []).map(p => ({
    id: String(p.id),
    name: p.name,
    cover: p.coverImgUrl || '',
    count: p.trackCount || 0,
    creator: p.creator?.nickname || '',
  }))
}

// QQ Music: 搜索
async function qqSearch(keyword, limit = 20) {
  const url = `https://${QQ_API.host}${QQ_API.search}?w=${encodeURIComponent(keyword)}&n=${limit}&format=json&catZhida=1&t=0&flag=1&ie=utf-8&sem=1&aggr=0&perpage=20&n=20&p=1&remoteplace=txt.mqq.all`
  const res = await doRequest(url, {
    headers: { Referer: 'https://y.qq.com', Host: QQ_API.host },
  })
  if (res.status !== 200 || !res.data || res.data.code !== 0) return []
  return (res.data.data?.song?.list || []).map(s => ({
    id: String(s.songid || s.id),
    name: s.songname || s.name,
    artists: (s.singer || []).map(a => a.name).join(' / '),
    album: s.albumname || '',
    cover: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
    platform: 'qq',
    platformName: 'QQ音乐',
    duration: s.interval || 0,
  }))
}

// QQ Music: 获取播放地址
async function qqSongUrl(id) {
  try {
    const keyUrl = `https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg?songmid=${id}&format=json`
    const res = await doRequest(keyUrl, {
      headers: { Referer: 'https://y.qq.com', Host: 'c.y.qq.com' },
    })
    if (res.status === 200 && res.data?.data?.length > 0) {
      const purl = res.data.data[0].purl || res.data.data[0].file?.purl
      if (purl) return `http://dl.stream.qqmusic.qq.com/${purl}`
    }
  } catch {}
  return ''
}

exports.main = async (event) => {
  const { action, keyword, platform, id, uid, limit } = event

  try {
    switch (action) {
      case 'search':
        const results = []
        if (platform === 'all' || platform === 'netease' || !platform) {
          try { results.push(...(await neteaseSearch(keyword, limit || 20))) } catch {}
        }
        if (platform === 'all' || platform === 'qq') {
          try { results.push(...(await qqSearch(keyword, limit || 20))) } catch {}
        }
        return { songs: results }

      case 'url':
        if (!id) return { url: '' }
        if (platform === 'qq') return { url: await qqSongUrl(id) }
        return { url: await neteaseSongUrl(id) }

      case 'playlist':
        if (!uid) return { playlists: [] }
        return { playlists: await neteasePlaylist(uid) }

      case 'playlistDetail':
        if (!id) return { songs: [] }
        // NetEase playlist detail
        const detailUrl = `https://music.163.com/api/playlist/detail?id=${id}`
        const detail = await doRequest(detailUrl)
        if (detail.data?.code === 200 && detail.data.result) {
          const p = detail.data.result
          return {
            playlist: {
              id: String(p.id),
              name: p.name,
              cover: p.coverImgUrl || '',
              songs: (p.tracks || []).map(s => ({
                id: String(s.id),
                name: s.name,
                artists: (s.ar || []).map(a => a.name).join(' / '),
                album: s.al?.name || '',
                cover: s.al?.picUrl || '',
                platform: 'netease',
                platformName: '网易云音乐',
                duration: s.dt || 0,
              })),
            },
          }
        }
        return { playlist: null }

      default:
        return { error: '未知操作' }
    }
  } catch (err) {
    return { error: err.message }
  }
}
