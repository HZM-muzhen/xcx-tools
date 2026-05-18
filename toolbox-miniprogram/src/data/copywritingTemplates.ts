export interface CopywritingTemplate {
  id: string
  name: string
  description: string
  variables: { key: string; label: string; placeholder: string }[]
  template: string
}

export interface CopywritingCategory {
  id: string
  name: string
  icon: string
  templates: CopywritingTemplate[]
}

export const copywritingCategories: CopywritingCategory[] = [
  {
    id: 'moments', name: '朋友圈', icon: '📱',
    templates: [
      { id: 'travel', name: '旅行分享', description: '晒旅行照片配文', variables: [
        { key: 'place', label: '目的地', placeholder: '如：大理' },
        { key: 'feeling', label: '感受', placeholder: '如：放松惬意' },
        { key: 'food', label: '美食', placeholder: '如：野生菌火锅' },
      ], template: '📍{{place}}\n\n终于来到心心念念的{{place}}，每一帧都是风景🏞️\n{{feeling}}的时光配上{{food}}，完美！\n\n#旅行日记 #{{place}}' },
      { id: 'food', name: '美食打卡', description: '分享美食体验', variables: [
        { key: 'food', label: '美食名称', placeholder: '如：寿司' },
        { key: 'restaurant', label: '餐厅/地点', placeholder: '如：XX日料店' },
        { key: 'taste', label: '口感', placeholder: '如：入口即化' },
      ], template: '🍽️ 今日美食打卡：{{food}}\n\n在{{restaurant}}吃到了超赞的{{food}}！{{taste}}，回味无穷～\n\n推荐指数：⭐⭐⭐⭐⭐\n\n#美食打卡 #{{restaurant}}' },
      { id: 'daily', name: '日常碎碎念', description: '记录日常心情', variables: [
        { key: 'mood', label: '今日心情', placeholder: '如：元气满满' },
        { key: 'event', label: '发生的事', placeholder: '如：终于读完了那本书' },
        { key: 'thought', label: '感悟', placeholder: '如：坚持就是胜利' },
      ], template: '✨ 今日{{mood}}\n\n{{event}}，小小确幸～\n\n{{thought}} 💪\n\n#日常 #生活碎片' },
    ],
  },
  {
    id: 'blessing', name: '祝福语', icon: '🎉',
    templates: [
      { id: 'birthday', name: '生日祝福', description: '生日祝福语', variables: [
        { key: 'name', label: '对方名字', placeholder: '如：小王' },
        { key: 'relation', label: '关系', placeholder: '如：最好的朋友' },
        { key: 'wish', label: '祝福', placeholder: '如：暴富暴美' },
      ], template: '🎂 生日快乐，{{name}}！\n\n亲爱的{{relation}}，今天是你的大日子～\n愿你在新的一岁里{{wish}}，每天都开开心心！\n\n生日快乐 🎈🎁\n\n#生日祝福' },
      { id: 'newyear', name: '新年祝福', description: '春节/元旦祝福', variables: [
        { key: 'year', label: '年份', placeholder: '如：2026' },
        { key: 'wish', label: '祝福内容', placeholder: '如：身体健康、万事如意' },
      ], template: '🧧 {{year}}新年快乐！\n\n辞旧迎新，祝大家{{year}}年：\n🎊 {{wish}}\n🎊 心想事成\n🎊 笑口常开\n\n新年快乐，万事大吉！🏮\n\n#{{year}}新年 #新年祝福' },
      { id: 'wedding', name: '婚礼祝福', description: '参加婚礼用', variables: [
        { key: 'groom', label: '新郎', placeholder: '如：小明' },
        { key: 'bride', label: '新娘', placeholder: '如：小红' },
      ], template: '💒 祝{{groom}}&{{bride}}\n\n新婚快乐，百年好合！💍\n愿你们的爱情像今天一样，永远灿烂美好～\n\n祝福你们，幸福一辈子！🎉\n\n#婚礼祝福' },
    ],
  },
  {
    id: 'marketing', name: '营销文案', icon: '📢',
    templates: [
      { id: 'promo', name: '促销活动', description: '限时优惠推广', variables: [
        { key: 'product', label: '产品/服务', placeholder: '如：夏季新品' },
        { key: 'discount', label: '优惠力度', placeholder: '如：全场8折' },
        { key: 'deadline', label: '截止时间', placeholder: '如：6月30日' },
      ], template: '🔥 限时特惠 | {{product}}\n\n🎁 {{discount}}\n⏰ 活动截止：{{deadline}}\n\n数量有限，先到先得！\n点击了解详情 👇\n\n#限时优惠 #{{product}}' },
      { id: 'newproduct', name: '新品上市', description: '新品发布文案', variables: [
        { key: 'product', label: '产品名称', placeholder: '如：智能手表X1' },
        { key: 'feature', label: '核心卖点', placeholder: '如：续航30天' },
        { key: 'price', label: '价格', placeholder: '如：¥299' },
      ], template: '🚀 重磅上新 | {{product}}\n\n✨ 核心亮点：{{feature}}\n💰 首发价：{{price}}\n\n全新体验，即刻拥有！\n\n#新品上市 #{{product}}' },
    ],
  },
  {
    id: 'love', name: '表白情话', icon: '💕',
    templates: [
      { id: 'confess', name: '深情告白', description: '向喜欢的人表白', variables: [
        { key: 'name', label: '对方名字', placeholder: '如：小可爱' },
        { key: 'moment', label: '心动时刻', placeholder: '如：第一次见你的那个下午' },
      ], template: '💌 致{{name}}：\n\n从{{moment}}起，我的世界就变得不一样了。\n\n我喜欢你，不是一时兴起，是深思熟虑。\n\n你愿意给我一个机会吗？🌹' },
      { id: 'valentine', name: '情人节', description: '情人节卡片', variables: [
        { key: 'name', label: '对方昵称', placeholder: '如：宝贝' },
        { key: 'memory', label: '美好回忆', placeholder: '如：一起看过的日出' },
      ], template: '🌹 Happy Valentine\'s Day\n\n{{name}}，谢谢你出现在我的生命里。\n记得{{memory}}，那是我最幸福的时刻。\n\n未来还很长，我想和你慢慢走。💕\n\n#情人节快乐' },
    ],
  },
  {
    id: 'thanks', name: '感谢文案', icon: '🙏',
    templates: [
      { id: 'thankfriend', name: '感谢朋友', description: '感谢朋友帮助', variables: [
        { key: 'name', label: '对方名字', placeholder: '如：老张' },
        { key: 'help', label: '帮助了什么', placeholder: '如：帮我搬家' },
      ], template: '🙏 感谢{{name}}！\n\n谢谢你{{help}}，真的帮了大忙！\n有你这个朋友，是我的福气～\n\n改天请你吃饭！🍜\n\n#感恩有你' },
    ],
  },
  {
    id: 'apology', name: '道歉文案', icon: '😔',
    templates: [
      { id: 'sorry', name: '诚恳道歉', description: '向朋友/伴侣道歉', variables: [
        { key: 'name', label: '对方名字', placeholder: '如：亲爱的' },
        { key: 'mistake', label: '做错的事', placeholder: '如：忘记了我们的约定' },
      ], template: '😔 {{name}}，对不起\n\n关于{{mistake}}，是我做得不对。\n没有任何借口，我真诚地向你道歉。\n\n希望你能原谅我，给我一个弥补的机会。🙏\n\n#对不起' },
    ],
  },
]
