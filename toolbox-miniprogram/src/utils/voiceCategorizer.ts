export interface MeetingSection {
  type: 'agenda' | 'discussion' | 'decision' | 'action_item' | 'note'
  heading: string
  content: string
}

export interface MeetingNote {
  title: string
  date: string
  sections: MeetingSection[]
}

const patterns: { type: MeetingSection['type']; keywords: string[]; heading: string }[] = [
  { type: 'agenda', keywords: ['会议主题', '议题', '今天讨论', '主要议题', '会议议程', '本次会议'], heading: '会议议题' },
  { type: 'decision', keywords: ['决定', '决议', '一致同意', '最终确定', '投票结果', '结论是', '达成共识'], heading: '决定事项' },
  { type: 'action_item', keywords: ['下一步', '待办', '负责', '截止', 'action', 'TODO', '需要做', '跟进', '由.*负责'], heading: '行动项' },
  { type: 'note', keywords: ['补充', '备注', '说明', '注意', 'FYI', '另外', '顺便'], heading: '备注' },
]

const sectionIcons: Record<MeetingSection['type'], string> = {
  agenda: '📋',
  discussion: '💬',
  decision: '✅',
  action_item: '📌',
  note: '📝',
}

export function getSectionIcon(type: string): string {
  return (sectionIcons as Record<string, string>)[type] || '📄'
}

export function categorize(rawText: string): MeetingNote {
  const segments = splitText(rawText)
  const sections: MeetingSection[] = []

  for (const seg of segments) {
    const trimmed = seg.trim()
    if (!trimmed) continue

    let matched = false
    for (const p of patterns) {
      if (p.keywords.some(kw => new RegExp(kw).test(trimmed))) {
        const existing = sections.find(s => s.type === p.type)
        if (existing) {
          existing.content += '\n' + trimmed
        } else {
          sections.push({ type: p.type, heading: p.heading, content: trimmed })
        }
        matched = true
        break
      }
    }
    if (!matched) {
      const existing = sections.find(s => s.type === 'discussion')
      if (existing) {
        existing.content += '\n' + trimmed
      } else {
        sections.push({ type: 'discussion', heading: '讨论内容', content: trimmed })
      }
    }
  }

  const title = extractTitle(sections, rawText)
  const date = extractDate(rawText)

  return { title, date, sections }
}

function splitText(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .flatMap(seg => seg.split(/(?=\d+[.、])/))
    .flatMap(seg => seg.split(/(?=[一二三四五六七八九十]+[、])/))
    .filter(s => s.trim())
}

function extractTitle(sections: MeetingSection[], rawText: string): string {
  const agenda = sections.find(s => s.type === 'agenda')
  if (agenda) {
    const firstLine = agenda.content.split('\n')[0].slice(0, 40)
    return firstLine.replace(/^(会议主题|议题|主要议题)[：:]\s*/, '')
  }
  return rawText.slice(0, 30).replace(/\n/g, ' ') || '未命名会议记录'
}

function extractDate(text: string): string {
  const match = text.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/)
  if (match) return match[1]
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
}
