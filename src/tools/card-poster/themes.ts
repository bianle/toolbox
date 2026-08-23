export type CardRatio = '3:4' | '1:1' | '9:16'

export type GradientDirection =
  | '135deg'
  | '45deg'
  | '90deg'
  | '180deg'
  | '0deg'
  | '270deg'

export interface BackgroundPreset {
  id: string
  /** 色块预览用 */
  preview: string
  /** 应用到海报的完整渐变 */
  css: string
  start: string
  end: string
  mid?: string
  direction: GradientDirection
}

/** 内容卡片样式（白底正文，不随背景变） */
export const CARD_SURFACE = {
  card: '#ffffff',
  foreground: '#1c1917',
  muted: 'rgba(28, 25, 23, 0.58)',
  accent: '#2563eb',
  border: 'rgba(28, 25, 23, 0.06)',
  shadow: '0 24px 60px rgba(15, 23, 42, 0.18)',
  fontDisplay: '"Songti SC", "Noto Serif SC", "Source Han Serif SC", serif',
  fontBody: '"PingFang SC", "Noto Sans SC", "Helvetica Neue", sans-serif',
} as const

/**
 * 背景预设：与 ../madopic/script.js 的 backgroundPresets 对齐
 * @see ../madopic/script.js
 */
export const BG_PRESETS: BackgroundPreset[] = [
  {
    id: 'gradient1',
    start: '#A755F7',
    mid: '#7275F2',
    end: '#6C23AA',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #A755F7 0%, #7275F2 50%, #6C23AA 100%)',
    css: 'linear-gradient(135deg, #A755F7 0%, #7275F2 50%, #6C23AA 100%)',
  },
  {
    id: 'gradient2',
    start: '#f093fb',
    end: '#f5576c',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    css: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },
  {
    id: 'gradient3',
    start: '#4facfe',
    end: '#00f2fe',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    css: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },
  {
    id: 'gradient4',
    start: '#43e97b',
    end: '#38f9d7',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    css: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  },
  {
    id: 'gradient5',
    start: '#fa709a',
    end: '#fee140',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    css: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  },
  {
    id: 'gradient6',
    start: '#a8edea',
    end: '#fed6e3',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    css: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  },
  {
    id: 'gradient7',
    start: '#ffecd2',
    end: '#fcb69f',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    css: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  },
  {
    id: 'gradient8',
    start: '#ff9a9e',
    end: '#fecfef',
    direction: '135deg',
    preview: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    css: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  },
]

/** 与 madopic/index.html #gradientDirection 选项对齐 */
export const GRADIENT_DIRECTIONS: {
  value: GradientDirection
  label: string
}[] = [
  { value: '135deg', label: '左上到右下' },
  { value: '45deg', label: '左下到右上' },
  { value: '0deg', label: '左到右' },
  { value: '90deg', label: '上到下' },
  { value: '180deg', label: '下到上' },
  { value: '270deg', label: '右到左' },
]

export function buildGradient(
  start: string,
  end: string,
  direction: GradientDirection,
  mid?: string,
) {
  if (mid) {
    return `linear-gradient(${direction}, ${start} 0%, ${mid} 50%, ${end} 100%)`
  }
  return `linear-gradient(${direction}, ${start} 0%, ${end} 100%)`
}

export const CARD_RATIOS: {
  value: CardRatio
  label: string
  width: number
  height: number
}[] = [
  { value: '3:4', label: '3:4 小红书', width: 900, height: 1200 },
  { value: '1:1', label: '1:1 方形', width: 1080, height: 1080 },
  { value: '9:16', label: '9:16 竖版', width: 1080, height: 1920 },
]

export function getRatio(value: CardRatio) {
  return CARD_RATIOS.find((ratio) => ratio.value === value) ?? CARD_RATIOS[0]
}

export const SAMPLE_MARKDOWN = `# 周末笔记

把想法写成卡片，发小红书或朋友圈。

## 适合写什么

- 一段短文案
- 三条清单
- 一句金句

> 少即是多，排版交给海报。

支持 **加粗**、*斜体* 和 \`行内代码\`。`
