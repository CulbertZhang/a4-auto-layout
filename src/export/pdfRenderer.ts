import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { LayoutResult, ImagePlacement } from '../types'
import { A4, TEXT_CONFIG } from '../utils/constants'

const FONT_URL = 'https://fonts.gstatic.com/s/notosanssc/v37/k3kCo84MPvpLmixcA63oeAL7Iqp5IZJF9bmaG9_EnYxNbPCJo4xNrA.ttf'

let cachedFontBytes: ArrayBuffer | null = null

async function loadChineseFont(): Promise<ArrayBuffer> {
  if (cachedFontBytes) return cachedFontBytes

  const response = await fetch(FONT_URL)
  if (!response.ok) {
    throw new Error(`Failed to load font: ${response.status}`)
  }
  cachedFontBytes = await response.arrayBuffer()
  return cachedFontBytes
}

async function fileToUint8Array(file: File): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  return new Uint8Array(buffer)
}

function getImageTypeFromFile(file: File): 'jpeg' | 'png' {
  if (file.type === 'image/png') {
    return 'png'
  }
  return 'jpeg'
}

function drawTextWithWrap(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any
): number {
  if (!text || text.trim() === '') return y

  const lineHeight = fontSize * TEXT_CONFIG.LINE_HEIGHT
  let currentY = y
  let currentLine = ''

  for (const char of text) {
    const testLine = currentLine + char
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine !== '') {
      page.drawText(currentLine, {
        x,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1)
      })
      currentY -= lineHeight
      currentLine = char
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    page.drawText(currentLine, {
      x,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0.1, 0.1, 0.1)
    })
    currentY -= lineHeight
  }

  return currentY
}

async function renderPlacement(
  pdfDoc: PDFDocument,
  page: any,
  placement: ImagePlacement,
  font: any
): Promise<void> {
  const { contentUnit, imageArea, textArea } = placement

  const imageBytes = await fileToUint8Array(contentUnit.image.file)
  const imageType = getImageTypeFromFile(contentUnit.image.file)

  let pdfImage
  try {
    if (imageType === 'png') {
      pdfImage = await pdfDoc.embedPng(imageBytes)
    } else {
      pdfImage = await pdfDoc.embedJpg(imageBytes)
    }
  } catch {
    try {
      pdfImage = await pdfDoc.embedJpg(imageBytes)
    } catch {
      pdfImage = await pdfDoc.embedPng(imageBytes)
    }
  }

  const pdfY = A4.HEIGHT - imageArea.y - imageArea.height

  page.drawImage(pdfImage, {
    x: imageArea.x,
    y: pdfY,
    width: imageArea.width,
    height: imageArea.height
  })

  const textPdfY = A4.HEIGHT - textArea.y - TEXT_CONFIG.TITLE_FONT_SIZE

  let currentY = drawTextWithWrap(
    page,
    contentUnit.text.title,
    textArea.x,
    textPdfY,
    textArea.width,
    TEXT_CONFIG.TITLE_FONT_SIZE,
    font
  )

  if (contentUnit.text.description) {
    currentY -= TEXT_CONFIG.PADDING
    drawTextWithWrap(
      page,
      contentUnit.text.description,
      textArea.x,
      currentY,
      textArea.width,
      TEXT_CONFIG.DESC_FONT_SIZE,
      font
    )
  }
}

export async function generatePDF(
  layoutResult: LayoutResult,
  onProgress?: (current: number, total: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)

  const fontBytes = await loadChineseFont()
  const font = await pdfDoc.embedFont(fontBytes)

  const totalPages = layoutResult.pages.length

  for (let i = 0; i < totalPages; i++) {
    const pageLayout = layoutResult.pages[i]
    const page = pdfDoc.addPage([A4.WIDTH, A4.HEIGHT])

    for (const placement of pageLayout.placements) {
      await renderPlacement(pdfDoc, page, placement, font)
    }

    onProgress?.(i + 1, totalPages)
  }

  return pdfDoc.save()
}

export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'album.pdf'): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportToPDF(
  layoutResult: LayoutResult,
  filename?: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const pdfBytes = await generatePDF(layoutResult, onProgress)
  downloadPDF(pdfBytes, filename)
}
