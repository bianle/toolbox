import { useRef, useState } from 'react'
import { UploadIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

interface FileDropProps {
  accept: string
  title: string
  hint: string
  disabled?: boolean
  onFile: (file: File) => void
}

export function FileDrop({
  accept,
  title,
  hint,
  disabled = false,
  onFile,
}: FileDropProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        if (!disabled) handleFiles(event.dataTransfer.files)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center transition-colors hover:bg-muted/40 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        dragging && 'border-primary bg-muted/60',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <UploadIcon className="size-5 text-muted-foreground" />
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground">{hint}</span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
    </label>
  )
}
