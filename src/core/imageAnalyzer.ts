import type { ImageInfo, ContentUnit } from '../types'
import { ImageCategory } from '../types'
import { RATIO_THRESHOLD, TEXT_CONFIG } from '../utils/constants'

// 根据宽高比分类图片
export function classifyImage(width: number, height: number): ImageCategory {
  const ratio = width / height

  if (ratio > RATIO_THRESHOLD.WIDE_LANDSCAPE) {
    return ImageCategory.WIDE_LANDSCAPE
  } else if (ratio > RATIO_THRESHOLD.LANDSCAPE) {
    return ImageCategory.NORMAL_LANDSCAPE
  } else if (ratio >= RATIO_THRESHOLD.PORTRAIT) {
    return ImageCategory.SQUARE
  } else if (ratio >= RATIO_THRESHOLD.TALL_PORTRAIT) {
    return ImageCategory.NORMAL_PORTRAIT
  } else {
    return ImageCategory.TALL_PORTRAIT
  }
}

// 从File对象读取图片信息
export function loadImageInfo(file: File): Promise<ImageInfo> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const ratio = width / height
      const category = classifyImage(width, height)

      resolve({
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        objectUrl,
        width,
        height,
        ratio,
        category
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error(`Failed to load image: ${file.name}`))
    }
    img.src = objectUrl
  })
}

// 批量加载图片
export async function loadImages(files: File[]): Promise<ImageInfo[]> {
  const promises = files.map(file => loadImageInfo(file))
  return Promise.all(promises)
}

// 创建离屏Canvas用于文字测量
let measureCanvas: HTMLCanvasElement | null = null
let measureCtx: CanvasRenderingContext2D | null = null

function getMeasureContext(): CanvasRenderingContext2D {
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas')
    measureCtx = measureCanvas.getContext('2d')
  }
  return measureCtx!
}

// 计算文字渲染高度（支持自动换行）
export function calculateTextHeight(
  text: string,
  fontSize: number,
  maxWidth: number
): number {
  if (!text || text.trim() === '') return 0

  const ctx = getMeasureContext()
  ctx.font = `${fontSize}px ${TEXT_CONFIG.FONT_FAMILY}`

  let lines = 1
  let currentLineWidth = 0

  // 逐字符计算换行
  for (const char of text) {
    const charWidth = ctx.measureText(char).width
    if (currentLineWidth + charWidth > maxWidth) {
      lines++
      currentLineWidth = charWidth
    } else {
      currentLineWidth += charWidth
    }
  }

  return lines * fontSize * TEXT_CONFIG.LINE_HEIGHT + TEXT_CONFIG.PADDING * 2
}

// 计算内容单元的总文字高度
export function calculateContentTextHeight(
  title: string,
  description: string,
  slotWidth: number
): number {
  const titleHeight = calculateTextHeight(
    title,
    TEXT_CONFIG.TITLE_FONT_SIZE,
    slotWidth
  )
  const descHeight = calculateTextHeight(
    description,
    TEXT_CONFIG.DESC_FONT_SIZE,
    slotWidth
  )
  return titleHeight + descHeight
}

// 为内容单元计算文字高度
export function prepareContentUnits(
  units: ContentUnit[],
  slotWidth: number
): ContentUnit[] {
  return units.map(unit => ({
    ...unit,
    textHeight: calculateContentTextHeight(
      unit.text.title,
      unit.text.description,
      slotWidth
    )
  }))
}

// 按宽高比对图片进行分组统计
export function analyzeImageDistribution(images: ImageInfo[]): Record<ImageCategory, number> {
  const distribution: Record<ImageCategory, number> = {
    [ImageCategory.WIDE_LANDSCAPE]: 0,
    [ImageCategory.NORMAL_LANDSCAPE]: 0,
    [ImageCategory.SQUARE]: 0,
    [ImageCategory.NORMAL_PORTRAIT]: 0,
    [ImageCategory.TALL_PORTRAIT]: 0
  }

  for (const img of images) {
    distribution[img.category]++
  }

  return distribution
}

// 判断主要图片类型
export function getDominantCategory(images: ImageInfo[]): 'landscape' | 'portrait' | 'mixed' {
  const dist = analyzeImageDistribution(images)
  const landscapeCount = dist[ImageCategory.WIDE_LANDSCAPE] + dist[ImageCategory.NORMAL_LANDSCAPE]
  const portraitCount = dist[ImageCategory.NORMAL_PORTRAIT] + dist[ImageCategory.TALL_PORTRAIT]
  const total = images.length

  if (landscapeCount / total > 0.6) return 'landscape'
  if (portraitCount / total > 0.6) return 'portrait'
  return 'mixed'
}
