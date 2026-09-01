import { Marked } from 'marked'

export type HtmlOutputMode = 'fragment' | 'document'

export interface MdToHtmlOptions {
  gfm?: boolean
  breaks?: boolean
  outputMode?: HtmlOutputMode
  documentTitle?: string
}

export interface MdToHtmlResult {
  html: string
  error?: string
}

export const SAMPLE_MARKDOWN = `# Markdown 示例

一段 **粗体** 与 *斜体* 文本，以及 \`inline code\`。

## 列表

- 第一项
- 第二项
  - 嵌套项

## 代码块

\`\`\`js
console.log('Hello, Markdown!')
\`\`\`

## 表格

| 列 A | 列 B |
| ---- | ---- |
| 1    | 2    |

> 引用块示例
`

function createParser(options: MdToHtmlOptions) {
  return new Marked({
    gfm: options.gfm ?? true,
    breaks: options.breaks ?? true,
  })
}

function wrapDocument(body: string, title: string) {
  const safeTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body>
${body}
</body>
</html>`
}

export function mdToHtml(
  source: string,
  options: MdToHtmlOptions = {},
): MdToHtmlResult {
  const trimmed = source.trim()
  if (!trimmed) {
    return { html: '' }
  }

  try {
    const parser = createParser(options)
    const fragment = parser.parse(trimmed, { async: false }) as string
    const outputMode = options.outputMode ?? 'fragment'

    if (outputMode === 'document') {
      return {
        html: wrapDocument(fragment, options.documentTitle?.trim() || 'Document'),
      }
    }

    return { html: fragment }
  } catch (error) {
    return {
      html: '',
      error: error instanceof Error ? error.message : 'Markdown 解析失败',
    }
  }
}
