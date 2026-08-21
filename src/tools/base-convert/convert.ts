const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export const COMMON_BASES = [
  { value: 2, label: '二进制 (2)' },
  { value: 8, label: '八进制 (8)' },
  { value: 10, label: '十进制 (10)' },
  { value: 16, label: '十六进制 (16)' },
] as const

export function normalizeDigits(input: string) {
  return input.trim().replace(/\s+/g, '').replace(/^0x/i, '')
}

export function parseBigInt(input: string, base: number): bigint {
  const raw = normalizeDigits(input)
  if (!raw) {
    throw new Error('请输入数值')
  }
  if (base < 2 || base > 36) {
    throw new Error('进制需在 2–36 之间')
  }

  const negative = raw.startsWith('-')
  const body = negative ? raw.slice(1) : raw
  if (!body) {
    throw new Error('请输入数值')
  }

  let value = 0n
  const baseBig = BigInt(base)

  for (const char of body) {
    const digit = DIGITS.indexOf(char.toLowerCase())
    if (digit < 0 || digit >= base) {
      throw new Error(`字符 “${char}” 不属于 ${base} 进制`)
    }
    value = value * baseBig + BigInt(digit)
  }

  return negative ? -value : value
}

export function formatBigInt(value: bigint, base: number): string {
  if (base < 2 || base > 36) {
    throw new Error('进制需在 2–36 之间')
  }

  const negative = value < 0n
  let remaining = negative ? -value : value
  if (remaining === 0n) return '0'

  const baseBig = BigInt(base)
  let result = ''

  while (remaining > 0n) {
    const digit = Number(remaining % baseBig)
    result = DIGITS[digit] + result
    remaining /= baseBig
  }

  return negative ? `-${result}` : result
}
