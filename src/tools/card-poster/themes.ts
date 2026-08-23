export type CardRatio = 'free' | '3:4' | '1:1' | '9:16'

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

/** 内容卡片样式 */
export const CARD_SURFACE = {
  card: '#ffffff',
  textPrimary: '#0F0F0F',
  textSecondary: '#525252',
  textTertiary: '#878787',
  primary: '#5B5BD6',
  primaryHover: '#4A4AC4',
  backgroundSecondary: '#FAFAFA',
  backgroundGray: '#F5F5F5',
  border: '#E6E6E6',
  shadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
  fontBody:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Noto Sans SC", sans-serif',
  fontMono:
    '"SF Mono", Monaco, Inconsolata, "Roboto Mono", ui-monospace, monospace',
  baseFontSize: 18,
  contentPadding: 24,
  framePadding: 32,
} as const

/** 正文字号派生变量 */
export function buildContentFontVars(baseFontSize: number = CARD_SURFACE.baseFontSize) {
  return {
    '--dynamic-font-size': `${baseFontSize}px`,
    '--dynamic-h1-size': `${Math.round(baseFontSize * 1.75)}px`,
    '--dynamic-h2-size': `${Math.round(baseFontSize * 1.375)}px`,
    '--dynamic-h3-size': `${Math.round(baseFontSize * 1.125)}px`,
    '--dynamic-code-size': `${Math.round(baseFontSize * 0.875)}px`,
    '--dynamic-quote-size': `${Math.round(baseFontSize * 0.95)}px`,
  } as const
}

/** 背景渐变预设 */
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

/** 渐变方向选项 */
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
  /** width / height；自由模式按内容自适应 */
  aspect: number | null
  /** 切换比例时的默认宽度 */
  defaultWidth: number
}[] = [
  { value: 'free', label: '自由', aspect: null, defaultWidth: 640 },
  { value: '3:4', label: '3:4 小红书', aspect: 3 / 4, defaultWidth: 640 },
  { value: '1:1', label: '1:1 方形', aspect: 1, defaultWidth: 640 },
  { value: '9:16', label: '9:16 竖版', aspect: 9 / 16, defaultWidth: 640 },
]

/** 文字与布局滑块范围 */
export const LAYOUT_LIMITS = {
  fontSize: { min: 14, max: 22, step: 0.5, default: 18 },
  width: { min: 480, max: 800, step: 20, default: 640 },
  padding: { min: 8, max: 60, step: 2, default: 24 },
} as const

export function getRatio(value: CardRatio) {
  return CARD_RATIOS.find((ratio) => ratio.value === value) ?? CARD_RATIOS[0]
}

export function isFreeRatio(value: CardRatio) {
  return value === 'free'
}

export function getCanvasSize(
  ratioValue: CardRatio,
  width: number,
  /** 自由模式下用实测内容高度 */
  measuredHeight?: number,
) {
  const ratio = getRatio(ratioValue)
  if (ratio.aspect == null) {
    return {
      width,
      height: measuredHeight ?? Math.round(width * 0.75),
      autoHeight: true as const,
    }
  }
  return {
    width,
    height: Math.round(width / ratio.aspect),
    autoHeight: false as const,
  }
}

export const SAMPLE_MARKDOWN = `# 周末笔记

把想法写成卡片，发小红书或朋友圈。

## 适合写什么

- 一段短文案
- 三条清单
- 一句金句

> 少即是多，排版交给海报。

支持 **加粗**、*斜体* 和 \`行内代码\`。`
