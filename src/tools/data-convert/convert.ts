import { XMLBuilder, XMLParser } from 'fast-xml-parser'
import { dump as dumpYaml, load as loadYaml } from 'js-yaml'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'

export type DataFormat = 'json' | 'yaml' | 'xml' | 'toml'

export const DATA_FORMATS: { value: DataFormat; label: string }[] = [
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'toml', label: 'TOML' },
]

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true,
})

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
})

function assertTomlFriendly(value: unknown, path = 'root'): void {
  if (value === null) {
    throw new Error(`TOML 不支持 null（位于 ${path}）`)
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertTomlFriendly(item, `${path}[${index}]`))
    return
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      assertTomlFriendly(child, `${path}.${key}`)
    }
  }
}

function wrapXmlRoot(value: unknown): Record<string, unknown> {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const keys = Object.keys(value as Record<string, unknown>)
    if (keys.length === 1) {
      return value as Record<string, unknown>
    }
  }
  return { root: value as never }
}

export function parseData(text: string, format: DataFormat): unknown {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error('输入为空')
  }

  switch (format) {
    case 'json':
      return JSON.parse(trimmed)
    case 'yaml': {
      const value = loadYaml(trimmed)
      if (value === undefined) {
        throw new Error('YAML 解析结果为空')
      }
      return value
    }
    case 'xml':
      return xmlParser.parse(trimmed)
    case 'toml':
      return parseToml(trimmed)
    default:
      throw new Error('不支持的源格式')
  }
}

export function serializeData(value: unknown, format: DataFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(value, null, 2)
    case 'yaml':
      return dumpYaml(value, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
      }).trimEnd()
    case 'xml':
      return String(xmlBuilder.build(wrapXmlRoot(value))).trimEnd()
    case 'toml':
      assertTomlFriendly(value)
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('TOML 根节点必须是对象')
      }
      return stringifyToml(value as Record<string, unknown>).trimEnd()
    default:
      throw new Error('不支持的目标格式')
  }
}

export function convertData(
  text: string,
  from: DataFormat,
  to: DataFormat,
): string {
  if (from === to) {
    // Still round-trip to normalize formatting.
    return serializeData(parseData(text, from), to)
  }
  return serializeData(parseData(text, from), to)
}

export const SAMPLE_BY_FORMAT: Record<DataFormat, string> = {
  json: `{
  "name": "toolbox",
  "version": 1,
  "tags": ["json", "yaml"],
  "meta": {
    "enabled": true
  }
}`,
  yaml: `name: toolbox
version: 1
tags:
  - json
  - yaml
meta:
  enabled: true`,
  xml: `<toolbox>
  <name>toolbox</name>
  <version>1</version>
  <tags>json</tags>
  <tags>yaml</tags>
  <meta>
    <enabled>true</enabled>
  </meta>
</toolbox>`,
  toml: `name = "toolbox"
version = 1
tags = [ "json", "yaml" ]

[meta]
enabled = true`,
}
