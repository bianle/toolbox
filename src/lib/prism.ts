import Prism from 'prismjs'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-sql'

export type PrismLanguage = 'json' | 'yaml' | 'xml' | 'html' | 'markup' | 'sql'

const LANGUAGE_ALIASES: Record<string, string> = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'markup',
  html: 'markup',
  markup: 'markup',
  sql: 'sql',
}

export function resolvePrismLanguage(language: string) {
  return LANGUAGE_ALIASES[language.toLowerCase()] ?? language.toLowerCase()
}

export function highlightCode(code: string, language: string) {
  const lang = resolvePrismLanguage(language)
  const grammar = Prism.languages[lang]
  if (!grammar) {
    return Prism.util.encode(code) as string
  }
  return Prism.highlight(code, grammar, lang)
}
