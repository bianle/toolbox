import { cut, default as init } from 'jieba-wasm/web'

import { splitByDelimiter } from '@/tools/detect-delimiter/detect'

export type BangMode = 'delimiter' | 'jieba'

export interface BangResult {
  tokens: string[]
  mode: BangMode
  delimiter: string | null
}

let ready: Promise<void> | null = null

async function ensureJieba() {
  if (!ready) {
    ready = init().then(() => undefined)
  }
  await ready
}

export async function cutWords(text: string, hmm = true): Promise<string[]> {
  await ensureJieba()
  return cut(text, hmm).filter((token) => token.trim().length > 0)
}

function flattenDelimiterSplit(text: string, delimiter: string) {
  return splitByDelimiter(text, delimiter)
    .flat()
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0)
}

export async function explodeText(
  text: string,
  mode: BangMode,
  delimiter = ', ',
): Promise<BangResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { tokens: [], mode, delimiter: mode === 'delimiter' ? delimiter : null }
  }

  if (mode === 'delimiter') {
    const active = delimiter.length > 0 ? delimiter : ', '
    return {
      tokens: flattenDelimiterSplit(trimmed, active),
      mode: 'delimiter',
      delimiter: active,
    }
  }

  return {
    tokens: await cutWords(trimmed),
    mode: 'jieba',
    delimiter: null,
  }
}
