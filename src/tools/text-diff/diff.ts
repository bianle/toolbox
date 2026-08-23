import { createTwoFilesPatch, diffLines } from 'diff'
import { html as diff2Html } from 'diff2html'
import { ColorSchemeType } from 'diff2html/lib/types.js'

export type DiffView = 'side-by-side' | 'line-by-line'

export interface DiffResult {
  added: number
  removed: number
  patch: string
}

export function computeDiff(
  left: string,
  right: string,
  ignoreWhitespace = false,
): DiffResult {
  const changes = diffLines(left, right, { ignoreWhitespace })

  let added = 0
  let removed = 0
  for (const change of changes) {
    const count = change.count ?? 0
    if (change.added) added += count
    if (change.removed) removed += count
  }

  const patch = createTwoFilesPatch(
    'text',
    'text',
    left,
    right,
    undefined,
    undefined,
    {
      context: Number.MAX_SAFE_INTEGER,
      ignoreWhitespace,
    },
  )

  return { added, removed, patch }
}

export function renderDiffHtml(patch: string, view: DiffView): string {
  return diff2Html(patch, {
    drawFileList: false,
    matching: 'lines',
    outputFormat: view === 'side-by-side' ? 'side-by-side' : 'line-by-line',
    colorScheme: ColorSchemeType.AUTO,
    renderNothingWhenEmpty: true,
  })
}

export const SAMPLE_LEFT = `name: toolbox
version: 1
tags:
  - json
  - yaml
enabled: true`

export const SAMPLE_RIGHT = `name: toolbox
version: 2
tags:
  - json
  - yaml
  - toml
enabled: true
note: updated`
