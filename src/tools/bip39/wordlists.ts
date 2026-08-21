import { wordlist as czech } from '@scure/bip39/wordlists/czech.js'
import { wordlist as english } from '@scure/bip39/wordlists/english.js'
import { wordlist as french } from '@scure/bip39/wordlists/french.js'
import { wordlist as italian } from '@scure/bip39/wordlists/italian.js'
import { wordlist as japanese } from '@scure/bip39/wordlists/japanese.js'
import { wordlist as korean } from '@scure/bip39/wordlists/korean.js'
import { wordlist as portuguese } from '@scure/bip39/wordlists/portuguese.js'
import { wordlist as simplifiedChinese } from '@scure/bip39/wordlists/simplified-chinese.js'
import { wordlist as spanish } from '@scure/bip39/wordlists/spanish.js'
import { wordlist as traditionalChinese } from '@scure/bip39/wordlists/traditional-chinese.js'

export type WordlistId =
  | 'english'
  | 'simplified-chinese'
  | 'traditional-chinese'
  | 'japanese'
  | 'korean'
  | 'spanish'
  | 'french'
  | 'italian'
  | 'portuguese'
  | 'czech'

export interface WordlistOption {
  id: WordlistId
  name: string
  words: string[]
}

export const WORDLIST_OPTIONS: WordlistOption[] = [
  { id: 'english', name: 'English', words: english },
  { id: 'simplified-chinese', name: '简体中文', words: simplifiedChinese },
  { id: 'traditional-chinese', name: '繁體中文', words: traditionalChinese },
  { id: 'japanese', name: '日本語', words: japanese },
  { id: 'korean', name: '한국어', words: korean },
  { id: 'spanish', name: 'Español', words: spanish },
  { id: 'french', name: 'Français', words: french },
  { id: 'italian', name: 'Italiano', words: italian },
  { id: 'portuguese', name: 'Português', words: portuguese },
  { id: 'czech', name: 'Čeština', words: czech },
]

export function getWordlist(id: WordlistId) {
  const option = WORDLIST_OPTIONS.find((item) => item.id === id)
  if (!option) throw new Error(`未知词表：${id}`)
  return option.words
}
