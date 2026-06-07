import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import type { LayoutResult, ImagePlacement } from '../types'
import { A4, TEXT_CONFIG } from '../utils/constants'

// 将dataUrl转换为Uint8Array
async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const base64 = dataUrl.split(',')[1]
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// 检测图片类型
function getImageType(dataUrl: string): 'jpeg' | 'png' {
  if (dataUrl.startsWith('data:image/png')) {
    return 'png'
  }
  return 'jpeg'
}

// 渲染文字到PDF页面（支持自动换行）
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

  // 绘制最后一行
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

// 渲染单个图片位置到PDF页面
async function renderPlacement(
  pdfDoc: PDFDocument,
  page: any,
  placement: ImagePlacement,
  font: any
): Promise<void> {
  const { contentUnit, imageArea, textArea } = placement

  // 嵌入图片
  const imageBytes = await dataUrlToUint8Array(contentUnit.image.dataUrl)
  const imageType = getImageType(contentUnit.image.dataUrl)

  let pdfImage
  try {
    if (imageType === 'png') {
      pdfImage = await pdfDoc.embedPng(imageBytes)
    } else {
      pdfImage = await pdfDoc.embedJpg(imageBytes)
    }
  } catch (error) {
    // 如果嵌入失败，尝试另一种格式
    try {
      pdfImage = await pdfDoc.embedJpg(imageBytes)
    } catch {
      pdfImage = await pdfDoc.embedPng(imageBytes)
    }
  }

  // PDF坐标系从左下角开始，需要转换Y坐标
  const pdfY = A4.HEIGHT - imageArea.y - imageArea.height

  // 绘制图片
  page.drawImage(pdfImage, {
    x: imageArea.x,
    y: pdfY,
    width: imageArea.width,
    height: imageArea.height
  })

  // 绘制文字
  const textPdfY = A4.HEIGHT - textArea.y - TEXT_CONFIG.TITLE_FONT_SIZE

  // 绘制标题
  let currentY = drawTextWithWrap(
    page,
    contentUnit.text.title,
    textArea.x,
    textPdfY,
    textArea.width,
    TEXT_CONFIG.TITLE_FONT_SIZE,
    font
  )

  // 绘制描述
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

// 生成PDF文档
export async function generatePDF(layoutResult: LayoutResult): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // 使用内置字体（不支持中文，后续可替换为嵌入字体）
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const pageLayout of layoutResult.pages) {
    // 创建A4页面
    const page = pdfDoc.addPage([A4.WIDTH, A4.HEIGHT])

    // 渲染每个图片位置
    for (const placement of pageLayout.placements) {
      await renderPlacement(pdfDoc, page, placement, font)
    }
  }

  return pdfDoc.save()
}

// 下载PDF文件
export function downloadPDF(pdfBytes: Uint8Array, filename: string = 'album.pdf'): void {
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 一键生成并下载PDF
export async function exportToPDF(
  layoutResult: LayoutResult,
  filename?: string
): Promise<void> {
  const pdfBytes = await generatePDF(layoutResult)
  downloadPDF(pdfBytes, filename)
}
