export type IpKind = 'ipv4' | 'ipv6'

export interface Endpoint {
  url: string
  parse: (text: string) => string | null
}

export interface PublicIpProvider {
  id: string
  name: string
  ipv4: Endpoint | null
  ipv6: Endpoint | null
}

export type IpSlot =
  | { status: 'idle' }
  | { status: 'unsupported' }
  | { status: 'loading' }
  | { status: 'ok'; ip: string }
  | { status: 'error'; message: string }

export interface PublicIpLookupResult {
  ipv4: IpSlot
  ipv6: IpSlot
}

const IPV4_RE = /^(?:\d{1,3}\.){3}\d{1,3}$/
const IPV6_RE = /^[0-9a-f:]+$/i
const REQUEST_TIMEOUT_MS = 8000

const parseIpifyJson = (text: string) => {
  try {
    const data = JSON.parse(text) as { ip?: string }
    return data.ip?.trim() || null
  } catch {
    return null
  }
}

const parsePlainIp = (text: string) => text.trim().split(/\s+/)[0] || null

function isValidIp(ip: string, kind: IpKind) {
  if (kind === 'ipv4') {
    if (!IPV4_RE.test(ip)) return false
    return ip.split('.').every((part) => {
      const n = Number(part)
      return n >= 0 && n <= 255
    })
  }
  return ip.includes(':') && IPV6_RE.test(ip)
}

function plain(url: string): Endpoint {
  return { url, parse: parsePlainIp }
}

function ipify(url: string): Endpoint {
  return { url, parse: parseIpifyJson }
}

export const PUBLIC_IP_PROVIDERS: PublicIpProvider[] = [
  {
    id: 'icanhazip',
    name: 'icanhazip',
    ipv4: plain('https://ipv4.icanhazip.com'),
    ipv6: plain('https://ipv6.icanhazip.com'),
  },
  {
    id: 'ipify',
    name: 'ipify',
    ipv4: ipify('https://api4.ipify.org?format=json'),
    ipv6: ipify('https://api6.ipify.org?format=json'),
  },
  {
    id: 'ident.me',
    name: 'ident.me',
    ipv4: plain('https://v4.ident.me'),
    ipv6: plain('https://v6.ident.me'),
  },
  {
    id: 'ip.sb',
    name: 'ip.sb',
    ipv4: plain('https://api-ipv4.ip.sb/ip'),
    ipv6: plain('https://api-ipv6.ip.sb/ip'),
  },
  {
    id: 'amazonaws',
    name: 'amazonaws',
    ipv4: plain('https://checkip.amazonaws.com'),
    ipv6: null,
  },
  {
    id: 'ifconfig.me',
    name: 'ifconfig.me',
    ipv4: plain('https://ifconfig.me/ip'),
    ipv6: null,
  },
  {
    id: 'ipinfo',
    name: 'ipinfo',
    ipv4: plain('https://ipinfo.io/ip'),
    ipv6: null,
  },
]

export const DEFAULT_PROVIDER_ID = PUBLIC_IP_PROVIDERS[0]!.id

export function getProviderById(id: string) {
  return PUBLIC_IP_PROVIDERS.find((provider) => provider.id === id)
}

async function fetchEndpoint(
  endpoint: Endpoint,
  kind: IpKind,
  signal?: AbortSignal,
): Promise<string> {
  const controller = new AbortController()
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(endpoint.url, {
      signal: controller.signal,
      cache: 'no-store',
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const text = await response.text()
    const ip = endpoint.parse(text)
    if (!ip) {
      throw new Error('无法解析响应')
    }
    if (!isValidIp(ip, kind)) {
      throw new Error(`返回非 ${kind.toUpperCase()} 地址`)
    }
    return ip
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    if (controller.signal.aborted) {
      throw new Error('请求超时')
    }
    throw new Error(error instanceof Error ? error.message : '请求失败')
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function resolveSlot(
  endpoint: Endpoint | null,
  kind: IpKind,
  signal?: AbortSignal,
): Promise<IpSlot> {
  if (!endpoint) return { status: 'unsupported' }
  try {
    const ip = await fetchEndpoint(endpoint, kind, signal)
    return { status: 'ok', ip }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    return {
      status: 'error',
      message: error instanceof Error ? error.message : '请求失败',
    }
  }
}

export async function fetchPublicIpsFromProvider(
  providerId: string,
  signal?: AbortSignal,
): Promise<PublicIpLookupResult> {
  const provider = getProviderById(providerId)
  if (!provider) {
    throw new Error('未知查询源')
  }

  const [ipv4, ipv6] = await Promise.all([
    resolveSlot(provider.ipv4, 'ipv4', signal),
    resolveSlot(provider.ipv6, 'ipv6', signal),
  ])

  return { ipv4, ipv6 }
}
