import { createAvatar } from '@dicebear/core'
import type { Result, Style, StyleOptions } from '@dicebear/core'
import {
  adventurer,
  bottts,
  funEmoji,
  identicon,
  initials,
  lorelei,
  pixelArt,
  rings,
  shapes,
} from '@dicebear/collection'

export const AVATAR_STYLES = [
  { key: 'identicon', label: '经典几何' },
  { key: 'initials', label: '首字母' },
  { key: 'bottts', label: '机器人' },
  { key: 'pixelArt', label: '像素' },
  { key: 'adventurer', label: '冒险者' },
  { key: 'lorelei', label: '卡通人物' },
  { key: 'rings', label: '圆环' },
  { key: 'shapes', label: '几何形状' },
  { key: 'funEmoji', label: '表情' },
] as const

export type StyleKey = (typeof AVATAR_STYLES)[number]['key']

const STYLE_MAP: Record<StyleKey, Style<Record<string, unknown>>> = {
  identicon,
  initials,
  bottts,
  pixelArt,
  adventurer,
  lorelei,
  rings,
  shapes,
  funEmoji,
}

export interface AvatarOptions {
  style: StyleKey
  seed: string
  size: number
  background: string | null
}

export function createAvatarResult(options: AvatarOptions): Result {
  const style = STYLE_MAP[options.style]
  const styleOptions: StyleOptions<Record<string, unknown>> = {
    seed: options.seed,
    size: options.size,
    backgroundColor: options.background
      ? [options.background.replace(/^#/, '')]
      : ['transparent'],
  }
  return createAvatar(style, styleOptions)
}

export function avatarDataUri(options: AvatarOptions): string {
  return createAvatarResult(options).toDataUri()
}

export async function avatarToPngBlob(
  options: AvatarOptions,
): Promise<Blob | null> {
  const img = new Image()
  img.src = createAvatarResult(options).toDataUri()
  await img.decode()

  const canvas = document.createElement('canvas')
  canvas.width = options.size
  canvas.height = options.size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(img, 0, 0, options.size, options.size)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

export function randomSeed(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
