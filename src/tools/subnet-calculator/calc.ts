export interface SubnetSegment {
  index: number
  cidr: string
  network: string
  firstHost: string
  lastHost: string
  broadcast: string
  usableHosts: number
}

export interface SubnetSplit {
  targetPrefix: number
  total: number
  truncated: boolean
  segments: SubnetSegment[]
}

export interface SubnetResult {
  ip: string
  prefix: number
  subnetMask: string
  wildcardMask: string
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  hostRange: string
  totalHosts: number
  usableHosts: number
  ipBinary: string
  maskBinary: string
  networkBinary: string
  broadcastBinary: string
  ipClass: string
  scope: string
  ipRole: string
}

function parseIpv4(value: string): number {
  const parts = value.trim().split('.')
  if (parts.length !== 4) {
    throw new Error('IP 地址格式应为 a.b.c.d')
  }
  let result = 0
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      throw new Error(`无效的 IP 段：${part}`)
    }
    const octet = Number(part)
    if (octet > 255) {
      throw new Error(`IP 段超出范围：${part}`)
    }
    result = (result << 8) | octet
  }
  return result >>> 0
}

function formatIpv4(value: number): string {
  return [24, 16, 8, 0]
    .map((shift) => (value >>> shift) & 0xff)
    .join('.')
}

function formatBinary(value: number): string {
  return [24, 16, 8, 0]
    .map((shift) => ((value >>> shift) & 0xff).toString(2).padStart(8, '0'))
    .join('.')
}

function prefixToMask(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
}

function countBits(value: number): number {
  let count = 0
  let n = value >>> 0
  while (n) {
    count += n & 1
    n >>>= 1
  }
  return count
}

function parsePrefix(value: string): number {
  let raw = value.trim()
  if (raw.startsWith('/')) {
    raw = raw.slice(1).trim()
  }
  if (/^\d{1,2}$/.test(raw)) {
    const prefix = Number(raw)
    if (prefix > 32) {
      throw new Error('前缀长度应在 0–32 之间')
    }
    return prefix
  }
  const mask = parseIpv4(raw)
  const inverted = ~mask >>> 0
  if ((inverted & (inverted + 1)) !== 0) {
    throw new Error('子网掩码不连续，例如 255.255.255.0')
  }
  return countBits(mask)
}

function getIpClass(ip: number): string {
  const first = ip >>> 24
  if (first === 0) return '保留（0.0.0.0/8）'
  if (first <= 126) return 'A 类'
  if (first === 127) return '回环（127.0.0.0/8）'
  if (first <= 191) return 'B 类'
  if (first <= 223) return 'C 类'
  if (first <= 239) return 'D 类（组播）'
  return 'E 类（保留）'
}

function getScope(ip: number): string {
  if ((ip & 0xff000000) >>> 0 === 0x0a000000) return '私有网络（10.0.0.0/8）'
  if ((ip & 0xfff00000) >>> 0 === 0xac100000)
    return '私有网络（172.16.0.0/12）'
  if ((ip & 0xffff0000) >>> 0 === 0xc0a80000)
    return '私有网络（192.168.0.0/16）'
  if ((ip & 0xff000000) >>> 0 === 0x7f000000) return '回环（Localhost）'
  if ((ip & 0xffff0000) >>> 0 === 0xa9fe0000) return '链路本地（APIPA）'
  if ((ip & 0xff000000) >>> 0 === 0xe0000000) return '组播'
  if ((ip & 0xf0000000) >>> 0 === 0xf0000000) return '保留'
  return '公网'
}

export function calculateSubnet(
  ipInput: string,
  maskInput: string,
): SubnetResult {
  let ipText = ipInput.trim()
  let maskText = maskInput.trim()

  if (ipText.includes('/')) {
    const [ipPart, maskPart = ''] = ipText.split('/')
    ipText = ipPart
    if (maskPart.trim()) {
      maskText = maskPart
    }
  }

  if (!ipText) {
    throw new Error('请输入 IPv4 地址')
  }
  if (!maskText) {
    throw new Error('请输入子网掩码或前缀长度')
  }

  const ip = parseIpv4(ipText)
  const prefix = parsePrefix(maskText)
  const mask = prefixToMask(prefix)
  const wildcard = ~mask >>> 0

  const network = ip & mask
  const broadcast = (network | wildcard) >>> 0

  const hostBits = 32 - prefix
  const totalHosts = 2 ** hostBits
  const usableHosts = hostBits >= 2 ? totalHosts - 2 : totalHosts

  const firstHost = hostBits >= 2 ? network + 1 : network
  const lastHost = hostBits >= 2 ? broadcast - 1 : broadcast

  const ipRole =
    prefix >= 32
      ? '单一主机地址（/32）'
      : prefix === 31
        ? '点对点可用地址（/31）'
        : ip === (network >>> 0)
          ? '网络地址'
          : ip === broadcast
            ? '广播地址'
            : '普通主机地址'

  return {
    ip: formatIpv4(ip),
    prefix,
    subnetMask: formatIpv4(mask),
    wildcardMask: formatIpv4(wildcard),
    network: formatIpv4(network),
    broadcast: formatIpv4(broadcast),
    firstHost: formatIpv4(firstHost),
    lastHost: formatIpv4(lastHost),
    hostRange: `${formatIpv4(firstHost)} – ${formatIpv4(lastHost)}`,
    totalHosts,
    usableHosts,
    ipBinary: formatBinary(ip),
    maskBinary: formatBinary(mask),
    networkBinary: formatBinary(network),
    broadcastBinary: formatBinary(broadcast),
    ipClass: getIpClass(ip),
    scope: getScope(ip),
    ipRole,
  }
}

export function splitSubnets(
  network: string,
  currentPrefix: number,
  targetPrefix: number,
  limit = 512,
): SubnetSplit {
  if (!Number.isInteger(targetPrefix)) {
    throw new Error('目标前缀应为整数')
  }
  if (targetPrefix < 0 || targetPrefix > 32) {
    throw new Error('目标前缀应在 0–32 之间')
  }
  if (targetPrefix < currentPrefix) {
    throw new Error('目标前缀不能小于当前前缀')
  }

  const base = parseIpv4(network)
  const targetMask = prefixToMask(targetPrefix)
  const wildcard = ~targetMask >>> 0
  const hostBits = 32 - targetPrefix
  const step = 2 ** hostBits
  const total = 2 ** (targetPrefix - currentPrefix)
  const count = Math.min(total, limit)

  const segments: SubnetSegment[] = []
  for (let i = 0; i < count; i += 1) {
    const net = (base + i * step) >>> 0
    const broadcast = (net | wildcard) >>> 0
    const firstHost = hostBits >= 2 ? net + 1 : net
    const lastHost = hostBits >= 2 ? broadcast - 1 : broadcast

    segments.push({
      index: i + 1,
      cidr: `${formatIpv4(net)}/${targetPrefix}`,
      network: formatIpv4(net),
      firstHost: formatIpv4(firstHost),
      lastHost: formatIpv4(lastHost),
      broadcast: formatIpv4(broadcast),
      usableHosts: hostBits >= 2 ? step - 2 : step,
    })
  }

  return {
    targetPrefix,
    total,
    truncated: total > count,
    segments,
  }
}
