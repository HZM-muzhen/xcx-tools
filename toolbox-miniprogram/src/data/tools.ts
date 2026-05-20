export interface ToolDefinition {
  id: string
  name: string
  icon: string
  description: string
  category: 'comprehensive' | 'office' | 'creative' | 'image'
  route: string
  needCloud: boolean
  enabled: boolean
}

export const toolRegistry: ToolDefinition[] = [
  {
    id: 'memo-box',
    name: '周记匣 MemoBox',
    icon: '📝',
    description: '每天记一记，周五一键生成周报',
    category: 'comprehensive',
    route: '/pages/tools/memo-box/memo-box',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'music',
    name: '云音乐',
    icon: '🎵',
    description: '多平台音乐搜索·歌单导入·在线播放',
    category: 'comprehensive',
    route: '/pages/tools/music/music',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'greeting-card',
    name: '祝福贺卡',
    icon: '💌',
    description: '节日祝福·生日贺卡·问候亲朋·感谢信',
    category: 'comprehensive',
    route: '/pages/tools/greeting-card/greeting-card',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'voice-notes',
    name: '语音转文字',
    icon: '🎙️',
    description: '录音转文字，自动整理会议记录',
    category: 'office',
    route: '/pages/tools/voice-notes/voice-notes',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'ocr',
    name: '文字识别',
    icon: '📷',
    description: '拍照识别图中文字，支持复制编辑',
    category: 'office',
    route: '/pages/tools/ocr/ocr',
    needCloud: true,
    enabled: true,
  },
  {
    id: 'copywriting',
    name: '文案生成',
    icon: '✍️',
    description: '朋友圈·祝福语·营销文案模板生成',
    category: 'creative',
    route: '/pages/tools/copywriting/copywriting',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'image-process',
    name: '图片处理',
    icon: '🖼️',
    description: '裁剪·旋转·滤镜·压缩·添加水印',
    category: 'image',
    route: '/pages/tools/image-process/image-process',
    needCloud: false,
    enabled: true,
  },
  {
    id: 'fun-image',
    name: '趣味图片',
    icon: '🎨',
    description: '长图拼接·九宫格切图·表情包制作',
    category: 'image',
    route: '/pages/tools/fun-image/fun-image',
    needCloud: false,
    enabled: true,
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return toolRegistry.find(t => t.id === id)
}

export function getEnabledTools(): ToolDefinition[] {
  return toolRegistry.filter(t => t.enabled)
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  return toolRegistry.filter(t => t.category === category && t.enabled)
}

export const categoryLabels: Record<ToolDefinition['category'], string> = {
  comprehensive: '综合应用',
  office: '办公效率',
  creative: '内容创作',
  image: '图片工具',
}
