import type { ContentUnit, Template, Slot, ImagePlacement, PageLayout, LayoutResult } from '../types'
import { ALL_TEMPLATES, getTemplatesForCount } from '../templates/templateDefinitions'
import { IMAGE_MIN, GAP } from '../utils/constants'
import { calculateContentTextHeight } from './imageAnalyzer'

// 计算图片在slot中的缩放和位置（不裁剪，居中显示）
export function calculateImagePlacement(
  contentUnit: ContentUnit,
  slot: Slot
): ImagePlacement {
  const { text } = contentUnit

  // 计算文字高度
  const textHeight = calculateContentTextHeight(text.title, text.description, slot.width)

  // 可用图片区域高度
  const availableImageHeight = slot.height - textHeight - GAP.VERTICAL

  if (availableImageHeight < IMAGE_MIN.HEIGHT) {
    // 图片区域太小，使用最小高度
    const imageAreaHeight = IMAGE_MIN.HEIGHT
    const textAreaHeight = slot.height - imageAreaHeight - GAP.VERTICAL

    return createPlacement(contentUnit, slot, imageAreaHeight, textAreaHeight)
  }

  return createPlacement(contentUnit, slot, availableImageHeight, textHeight)
}

function createPlacement(
  contentUnit: ContentUnit,
  slot: Slot,
  imageAreaHeight: number,
  textAreaHeight: number
): ImagePlacement {
  const { image } = contentUnit
  const imgRatio = image.ratio
  const slotRatio = slot.width / imageAreaHeight

  let scale: number
  let finalWidth: number
  let finalHeight: number
  let xOffset: number
  let yOffset: number

  if (imgRatio > slotRatio) {
    // 图片更宽 - 以宽度为基准缩放
    scale = slot.width / image.width
    finalWidth = slot.width
    finalHeight = image.height * scale
    xOffset = 0
    yOffset = (imageAreaHeight - finalHeight) / 2
  } else {
    // 图片更高 - 以高度为基准缩放
    scale = imageAreaHeight / image.height
    finalWidth = image.width * scale
    finalHeight = imageAreaHeight
    xOffset = (slot.width - finalWidth) / 2
    yOffset = 0
  }

  return {
    contentUnit,
    slot,
    imageArea: {
      x: slot.x + xOffset,
      y: slot.y + yOffset,
      width: finalWidth,
      height: finalHeight
    },
    textArea: {
      x: slot.x,
      y: slot.y + imageAreaHeight + GAP.VERTICAL,
      width: slot.width,
      height: textAreaHeight
    },
    scale
  }
}

// 计算模板适配得分
export function calculateFitScore(
  contentUnits: ContentUnit[],
  template: Template
): number {
  if (contentUnits.length !== template.slotCount) {
    return -1
  }

  let totalScore = 0

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i]
    const unit = contentUnits[i]
    const textHeight = calculateContentTextHeight(
      unit.text.title,
      unit.text.description,
      slot.width
    )

    // 可用图片高度
    const availableHeight = slot.height - textHeight - GAP.VERTICAL

    if (availableHeight < IMAGE_MIN.HEIGHT) {
      // 图片区域太小，扣分但不完全排除
      totalScore -= 0.5
      continue
    }

    const slotRatio = slot.width / availableHeight
    const imgRatio = unit.image.ratio

    // 计算空间利用率
    let scale: number
    if (imgRatio > slotRatio) {
      scale = slot.width / unit.image.width
    } else {
      scale = availableHeight / unit.image.height
    }

    const usedArea = (unit.image.width * scale) * (unit.image.height * scale)
    const slotArea = slot.width * availableHeight
    const utilization = usedArea / slotArea

    // 宽高比相似度
    const ratioDiff = Math.abs(imgRatio - slotRatio) / Math.max(imgRatio, slotRatio)
    const ratioScore = 1 - Math.min(ratioDiff, 1)

    // 综合得分: 60%空间利用率 + 40%比例匹配度
    totalScore += utilization * 0.6 + ratioScore * 0.4
  }

  return totalScore / template.slotCount
}

// 检查一组内容单元是否能放入模板
export function canFitInTemplate(
  contentUnits: ContentUnit[],
  template: Template
): boolean {
  if (contentUnits.length !== template.slotCount) {
    return false
  }

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i]
    const unit = contentUnits[i]
    const textHeight = calculateContentTextHeight(
      unit.text.title,
      unit.text.description,
      slot.width
    )

    const availableHeight = slot.height - textHeight - GAP.VERTICAL
    if (availableHeight < IMAGE_MIN.HEIGHT) {
      return false
    }
  }

  return true
}

// 生成候选图片组合
function generateCandidates(
  remaining: ContentUnit[],
  count: number
): ContentUnit[][] {
  if (remaining.length < count) {
    return []
  }

  if (count === 1) {
    return remaining.map(unit => [unit])
  }

  const candidates: ContentUnit[][] = []

  // 策略1: 按顺序取前N张
  candidates.push(remaining.slice(0, count))

  // 策略2: 按宽高比排序后取相似的
  const sortedByRatio = [...remaining].sort((a, b) => a.image.ratio - b.image.ratio)
  for (let i = 0; i <= sortedByRatio.length - count; i++) {
    const group = sortedByRatio.slice(i, i + count)
    if (!candidates.some(c => isSameGroup(c, group))) {
      candidates.push(group)
    }
  }

  // 策略3: 随机采样增加多样性
  for (let attempt = 0; attempt < Math.min(5, remaining.length); attempt++) {
    const shuffled = [...remaining].sort(() => Math.random() - 0.5)
    const group = shuffled.slice(0, count)
    if (!candidates.some(c => isSameGroup(c, group))) {
      candidates.push(group)
    }
  }

  return candidates
}

function isSameGroup(a: ContentUnit[], b: ContentUnit[]): boolean {
  if (a.length !== b.length) return false
  const aIds = new Set(a.map(u => u.id))
  return b.every(u => aIds.has(u.id))
}

// 为当前页面找到最佳模板和图片组合
interface PageAssignment {
  template: Template
  units: ContentUnit[]
  score: number
}

function findBestPageAssignment(
  remaining: ContentUnit[]
): PageAssignment | null {
  if (remaining.length === 0) {
    return null
  }

  let bestResult: PageAssignment | null = null

  // 从6张图片模板开始尝试，优先填充更多图片
  for (let count = Math.min(6, remaining.length); count >= 1; count--) {
    const templates = getTemplatesForCount(count)
    if (templates.length === 0) continue

    const candidates = generateCandidates(remaining, count)

    for (const template of templates) {
      for (const candidate of candidates) {
        if (!canFitInTemplate(candidate, template)) {
          continue
        }

        const score = calculateFitScore(candidate, template)

        // 优先选择图片数量更多的模板（每多一张图片加0.1分）
        const adjustedScore = score + count * 0.1

        if (!bestResult || adjustedScore > bestResult.score) {
          bestResult = {
            template,
            units: candidate,
            score: adjustedScore
          }
        }
      }
    }

    // 如果当前图片数量找到了合适的组合，不再尝试更少的图片
    if (bestResult) {
      if (bestResult.units.length === count) {
        break
      }
    }
  }

  return bestResult
}

// 主布局算法：将所有内容单元分配到页面
export function layoutContentUnits(contentUnits: ContentUnit[]): LayoutResult {
  const pages: PageLayout[] = []
  const remaining = [...contentUnits]

  while (remaining.length > 0) {
    const result = findBestPageAssignment(remaining)

    if (!result) {
      // 无法找到合适的模板，使用单图模板强制放置
      const unit = remaining.shift()!
      const template = ALL_TEMPLATES.find(t => t.slotCount === 1)!
      const placement = calculateImagePlacement(unit, template.slots[0])

      pages.push({
        pageIndex: pages.length,
        template,
        placements: [placement]
      })
    } else {
      // 使用找到的最佳组合
      const placements = result.units.map((unit, idx) =>
        calculateImagePlacement(unit, result.template.slots[idx])
      )

      pages.push({
        pageIndex: pages.length,
        template: result.template,
        placements
      })

      // 从剩余列表中移除已使用的内容单元
      for (const unit of result.units) {
        const idx = remaining.findIndex(u => u.id === unit.id)
        if (idx !== -1) {
          remaining.splice(idx, 1)
        }
      }
    }
  }

  return {
    pages,
    totalImages: contentUnits.length,
    totalPages: pages.length
  }
}
