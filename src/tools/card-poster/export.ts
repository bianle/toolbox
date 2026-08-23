import { toPng, toSvg } from 'html-to-image'

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = dataUrl
  link.click()
}

export async function exportCardPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
  })
  downloadDataUrl(dataUrl, filename)
  return dataUrl
}

export async function exportCardSvg(node: HTMLElement, filename: string) {
  const dataUrl = await toSvg(node, {
    cacheBust: true,
  })
  downloadDataUrl(dataUrl, filename)
  return dataUrl
}
