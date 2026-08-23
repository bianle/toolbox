let ready: Promise<void> | null = null

async function ensureJieba() {
  if (!ready) {
    ready = (async () => {
      const { default: init } = await import('jieba-wasm/web')
      await init()
    })()
  }
  await ready
}

export async function cutWords(text: string, hmm = true): Promise<string[]> {
  await ensureJieba()
  const { cut } = await import('jieba-wasm/web')
  return cut(text, hmm).filter((token) => token.trim().length > 0)
}
