export interface BulletPoint {
  text: string
  category: 'key' | 'info' | 'action'
}

export interface SummaryResult {
  title: string
  date: string
  points: BulletPoint[]
  rawText: string
}

export function summarize(text: string): SummaryResult {
  const sentences = splitSentences(text)
  const points: BulletPoint[] = []

  for (const s of sentences) {
    const trimmed = s.trim()
    if (!trimmed || trimmed.length < 4) continue

    if (isActionItem(trimmed)) {
      points.push({ text: cleanText(trimmed), category: 'action' })
    } else if (isKeyPoint(trimmed)) {
      points.push({ text: cleanText(trimmed), category: 'key' })
    } else if (trimmed.length > 15) {
      points.push({ text: cleanText(trimmed), category: 'info' })
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const unique = points.filter(p => {
    const key = p.text.slice(0, 20)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    title: extractTitle(text),
    date: extractDate(text),
    points: unique.length > 0 ? unique : [{ text: '未识别到有效内容，请检查录音或手动输入', category: 'info' }],
    rawText: text,
  }
}

function splitSentences(text: string): string[] {
  return text
    .split(/[。！？\n]+/)
    .flatMap(s => s.split(/[；;，,]+/))
    .flatMap(s => s.split(/(?=\d+[.、)）])/))
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

function isActionItem(text: string): boolean {
  const patterns = [
    /需要/, /必须/, /应该/, /要[做搞]/, /下一步/, /待办/, /负责/,
    /截止/, /完成/, /action/i, /TODO/, /跟进/, /去做/, /安排/,
    /任务/, /目标/, /计划/, /立即/, /马上/, /尽快/,
  ]
  return patterns.some(p => p.test(text))
}

function isKeyPoint(text: string): boolean {
  const patterns = [
    /^第[一二三四五六七八九十\d]+/, /^\d+[.、)）]/,
    /关键/, /重点/, /核心/, /重要/, /注意/,
    /总结/, /结论/, /结果是/, /最后/,
  ]
  return text.length > 10 && patterns.some(p => p.test(text))
}

function cleanText(text: string): string {
  return text
    .replace(/^(那个|然后|就是|就是说|嗯|啊|额|这个)\s*/g, '')
    .replace(/^那个|然后|就是说/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTitle(text: string): string {
  const firstLine = text.split(/[。\n]/)[0].slice(0, 50).trim()
  if (firstLine.length > 5) return firstLine
  return '语音记录摘要'
}

function extractDate(text: string): string {
  const match = text.match(/(\d{4}[-/年]\d{1,2}[-/月]\d{1,2}[日]?)/)
  if (match) return match[1]
  const today = new Date()
  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
}
