export type UriMode = 'component' | 'uri'

export function encodeUri(text: string, mode: UriMode) {
  return mode === 'component' ? encodeURIComponent(text) : encodeURI(text)
}

export function decodeUri(text: string, mode: UriMode) {
  try {
    return {
      ok: true as const,
      value: mode === 'component' ? decodeURIComponent(text) : decodeURI(text),
    }
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : '解码失败',
    }
  }
}
