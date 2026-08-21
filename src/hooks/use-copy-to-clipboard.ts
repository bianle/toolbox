import { useCallback, useState } from 'react'

import { copyToClipboard } from '@/utils/clipboard'

export function useCopyToClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string) => {
      await copyToClipboard(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), resetMs)
    },
    [resetMs],
  )

  return { copied, copy }
}
