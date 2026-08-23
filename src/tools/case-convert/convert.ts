export type CaseStyle =
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'screaming-snake'
  | 'kebab'
  | 'train'
  | 'lower'
  | 'upper'
  | 'title'
  | 'sentence'

export const CASE_STYLES: {
  id: CaseStyle
  label: string
  nameZh: string
}[] = [
  { id: 'camel', label: 'camelCase', nameZh: '小驼峰' },
  { id: 'pascal', label: 'PascalCase', nameZh: '大驼峰' },
  { id: 'snake', label: 'snake_case', nameZh: '蛇形' },
  { id: 'screaming-snake', label: 'SCREAMING_SNAKE', nameZh: '大写蛇形' },
  { id: 'kebab', label: 'kebab-case', nameZh: '短横线' },
  { id: 'train', label: 'Train-Case', nameZh: '列车式' },
  { id: 'lower', label: 'lower case', nameZh: '全小写' },
  { id: 'upper', label: 'UPPER CASE', nameZh: '全大写' },
  { id: 'title', label: 'Title Case', nameZh: '标题式' },
  { id: 'sentence', label: 'Sentence case', nameZh: '句首大写' },
]

export function toWords(input: string): string[] {
  const normalized = input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([0-9])([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])([0-9])/g, '$1 $2')

  return normalized
    .split(/[^A-Za-z0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .map((part) => part.toLowerCase())
}

function capitalize(word: string) {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

export function convertCase(input: string, style: CaseStyle): string {
  const words = toWords(input)
  if (words.length === 0) return ''

  switch (style) {
    case 'camel':
      return words
        .map((word, index) => (index === 0 ? word : capitalize(word)))
        .join('')
    case 'pascal':
      return words.map(capitalize).join('')
    case 'snake':
      return words.join('_')
    case 'screaming-snake':
      return words.map((word) => word.toUpperCase()).join('_')
    case 'kebab':
      return words.join('-')
    case 'train':
      return words.map(capitalize).join('-')
    case 'lower':
      return words.join(' ')
    case 'upper':
      return words.map((word) => word.toUpperCase()).join(' ')
    case 'title':
      return words.map(capitalize).join(' ')
    case 'sentence':
      return words
        .map((word, index) => (index === 0 ? capitalize(word) : word))
        .join(' ')
    default:
      return input
  }
}

export function convertAllCases(input: string) {
  return CASE_STYLES.map((style) => ({
    ...style,
    value: convertCase(input, style.id),
  }))
}
