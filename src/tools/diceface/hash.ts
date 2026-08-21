export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function bytesFromHex(hex: string): number[] {
  const out: number[] = []
  for (let i = 0; i < hex.length; i += 2) {
    out.push(Number.parseInt(hex.slice(i, i + 2), 16))
  }
  return out
}
