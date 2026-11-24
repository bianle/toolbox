export const GH_PROXY_PREFIXES = [
  'https://gh-proxy.org',
  'https://v4.gh-proxy.org',
  'https://v6.gh-proxy.org',
  'https://cdn.gh-proxy.org',
  'https://axisnow.gh-proxy.org',
] as const

export type GhProxyPrefix = (typeof GH_PROXY_PREFIXES)[number]

const SCHEME_URL = /(?:https?:\/\/|git@)[^\s'"<>]+/gi
const HAS_SCHEME_URL = /(?:https?:\/\/|git@)/i
const BARE_URL = /(?:www\.)?github\.com\/[^\s'"<>]+/gi
const HAS_BARE_URL = /(?:www\.)?github\.com\//i

/** 去掉已有的加速前缀，兼容带不带结尾斜杠的写法。 */
function stripProxy(url: string): string {
  for (const prefix of GH_PROXY_PREFIXES) {
    if (url === prefix) return ''
    if (url.startsWith(`${prefix}/`)) return url.slice(prefix.length)
  }
  return url
}

function normalize(url: string): string {
  if (url.startsWith('git@github.com:')) {
    return `https://github.com/${url.slice('git@github.com:'.length)}`
  }
  if (/^github\.com\//i.test(url)) {
    return `https://${url}`
  }
  return url
}

function proxyOne(raw: string, prefix: GhProxyPrefix): string {
  const trailing = raw.match(/[),.;]+$/)?.[0] ?? ''
  const core = trailing ? raw.slice(0, -trailing.length) : raw
  const target = normalize(stripProxy(core))
  if (!target) return raw
  return `${prefix}/${target.replace(/^\/+/, '')}${trailing}`
}

/** 替换文本中的 GitHub 链接为加速链接，保留命令其余部分。 */
export function toProxyText(input: string, prefix: GhProxyPrefix): string {
  const text = input.trim()
  if (!text) return ''

  if (HAS_SCHEME_URL.test(text)) {
    return text.replace(SCHEME_URL, (url) => proxyOne(url, prefix))
  }

  if (!HAS_BARE_URL.test(text)) return ''
  return text.replace(BARE_URL, (url) => proxyOne(url, prefix))
}
