import ImageTracer from 'imagetracerjs'
import { loadFromCanvas } from 'potrace-wasm'

export type TraceMode = 'mono' | 'color' | 'embed'

export type TraceDetail = 'low' | 'medium' | 'high'

export interface RasterSource {
  name: string
  dataUrl: string
  width: number
  height: number
}

export interface TraceOptions {
  mode: TraceMode
  threshold: number
  invert: boolean
  colors: number
  detail: TraceDetail
  maxEdge: number | null
}

export interface SvgResult {
  svg: string
  width: number
  height: number
}

export interface SvgRasterResult {
  dataUrl: string
  width: number
  height: number
}

export interface SvgInfo {
  width: number
  height: number
}

const MAX_FILE_SIZE = 30 * 1024 * 1024
const MAX_RASTER_WIDTH = 8192

const DETAIL_OPTIONS: Record<
  TraceDetail,
  { ltres: number; qtres: number; pathomit: number; blurradius?: number }
> = {
  low: { ltres: 4, qtres: 4, pathomit: 16, blurradius: 2 },
  medium: { ltres: 2, qtres: 2, pathomit: 8 },
  high: { ltres: 1, qtres: 1, pathomit: 4 },
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片加载失败'))
    image.src = src
  })
}

export async function readImageFile(file: File): Promise<RasterSource> {
  const looksLikeImage =
    file.type.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name)
  if (!looksLikeImage) {
    throw new Error('请选择 PNG、JPEG、WebP 等图片文件')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('图片过大，限制 30MB')
  }

  const dataUrl = await readFileAsDataUrl(file)
  const image = await loadImage(dataUrl)

  return {
    name: file.name,
    dataUrl,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
  }
}

async function imageToCanvas(source: RasterSource, maxEdge: number | null) {
  const image = await loadImage(source.dataUrl)
  let width = image.naturalWidth || source.width
  let height = image.naturalHeight || source.height

  if (!width || !height) {
    throw new Error('无法获取图片尺寸')
  }

  if (maxEdge && Math.max(width, height) > maxEdge) {
    const scale = maxEdge / Math.max(width, height)
    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('浏览器不支持 Canvas')
  }
  context.drawImage(image, 0, 0, width, height)

  return canvas
}

async function traceMono(
  source: RasterSource,
  options: TraceOptions,
): Promise<SvgResult> {
  const canvas = await imageToCanvas(source, options.maxEdge)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('浏览器不支持 Canvas')
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const threshold = options.threshold

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3] / 255
    const luminance =
      0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2]
    const composited = luminance * alpha + 255 * (1 - alpha)
    let ink = composited < threshold
    if (options.invert) ink = !ink
    const value = ink ? 0 : 255
    data[index] = value
    data[index + 1] = value
    data[index + 2] = value
    data[index + 3] = 255
  }

  context.putImageData(imageData, 0, 0)
  const svg = (await loadFromCanvas(canvas))
    .replace(/<\?xml[\s\S]*?\?>/i, '')
    .replace(/<!DOCTYPE[\s\S]*?>/i, '')
    .trim()

  return { svg, width: canvas.width, height: canvas.height }
}

async function traceColor(
  source: RasterSource,
  options: TraceOptions,
): Promise<SvgResult> {
  const canvas = await imageToCanvas(source, options.maxEdge)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) {
    throw new Error('浏览器不支持 Canvas')
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const detail = DETAIL_OPTIONS[options.detail]
  const svg = ImageTracer.imagedataToSVG(imageData, {
    ...detail,
    colorsampling: 2,
    numberofcolors: options.colors,
    colorquantcycles: 3,
    layering: 0,
    strokewidth: 1,
    scale: 1,
    roundcoords: 1,
    viewbox: true,
    desc: false,
  })

  return { svg, width: canvas.width, height: canvas.height }
}

async function embedRaster(source: RasterSource): Promise<SvgResult> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${source.width}" height="${source.height}" viewBox="0 0 ${source.width} ${source.height}"><image width="${source.width}" height="${source.height}" href="${source.dataUrl}"/></svg>`
  return { svg, width: source.width, height: source.height }
}

export async function convertPngToSvg(
  source: RasterSource,
  options: TraceOptions,
): Promise<SvgResult> {
  if (options.mode === 'embed') {
    return embedRaster(source)
  }
  if (options.mode === 'color') {
    return traceColor(source, options)
  }
  return traceMono(source, options)
}

function parseLength(value: string | null) {
  if (!value) return null
  const match = value.trim().match(/^([\d.]+)(px)?$/i)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function parseSvgDocument(text: string) {
  if (!text.trim()) {
    throw new Error('请输入 SVG 代码或选择 SVG 文件')
  }

  const document = new DOMParser().parseFromString(text, 'image/svg+xml')
  if (document.querySelector('parsererror')) {
    throw new Error('SVG 代码解析失败')
  }

  const root = document.documentElement
  if (root.localName !== 'svg') {
    throw new Error('不是有效的 SVG 文件')
  }

  const viewBox = root.getAttribute('viewBox')
  let viewBoxWidth = 0
  let viewBoxHeight = 0
  if (viewBox) {
    const parts = viewBox.split(/[\s,]+/).map(Number)
    if (
      parts.length === 4 &&
      parts.every((part) => Number.isFinite(part)) &&
      parts[2] > 0 &&
      parts[3] > 0
    ) {
      viewBoxWidth = parts[2]
      viewBoxHeight = parts[3]
    }
  }

  let width = parseLength(root.getAttribute('width'))
  let height = parseLength(root.getAttribute('height'))

  if (width && !height && viewBoxWidth > 0) {
    height = (width * viewBoxHeight) / viewBoxWidth
  }
  if (height && !width && viewBoxHeight > 0) {
    width = (height * viewBoxWidth) / viewBoxHeight
  }

  width ??= viewBoxWidth || 300
  height ??= viewBoxHeight || 150

  if (!(width > 0) || !(height > 0)) {
    throw new Error('无法确定 SVG 尺寸')
  }

  return { document, root, info: { width, height } }
}

export function getSvgInfo(text: string): SvgInfo {
  return parseSvgDocument(text).info
}

function normalizeSvg(text: string, info: SvgInfo) {
  const { document, root } = parseSvgDocument(text)

  if (!root.getAttribute('xmlns')) {
    root.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }
  if (!root.getAttribute('viewBox')) {
    root.setAttribute('viewBox', `0 0 ${info.width} ${info.height}`)
  }
  root.setAttribute('width', String(info.width))
  root.setAttribute('height', String(info.height))

  return new XMLSerializer().serializeToString(document)
}

export async function rasterizeSvg(
  text: string,
  options: { width: number; background: string },
): Promise<SvgRasterResult> {
  const info = getSvgInfo(text)
  const normalized = normalizeSvg(text, info)
  const blob = new Blob([normalized], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const image = await loadImage(url)
    const width = Math.min(
      MAX_RASTER_WIDTH,
      Math.max(1, Math.round(options.width)),
    )
    const height = Math.max(1, Math.round((width * info.height) / info.width))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      throw new Error('浏览器不支持 Canvas')
    }

    if (options.background !== 'transparent') {
      context.fillStyle = options.background
      context.fillRect(0, 0, width, height)
    }
    context.drawImage(image, 0, 0, width, height)

    return {
      dataUrl: canvas.toDataURL('image/png'),
      width,
      height,
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = href
  link.click()
}

export function downloadText(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, filename)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  triggerDownload(dataUrl, filename)
}

export function replaceExtension(name: string, extension: string) {
  const base = name.replace(/\.[^./\\]+$/, '')
  return `${base || 'image'}.${extension}`
}
