import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { copyToClipboard } from '@/utils/clipboard'

export function useCopyToClipboard(resetMs = 1500) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    async (text: string, successMessage = '已复制') => {
      await copyToClipboard(text)
      toast.success(successMessage)
      setCopied(true)
      window.setTimeout(() => setCopied(false), resetMs)
    },
    [resetMs],
  )

  return { copied, copy }
}
