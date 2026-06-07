import type { ContentUnit, Template, Slot, ImagePlacement, PageLayout, LayoutResult } from '../types'
import { ALL_TEMPLATES, getTemplatesForCount } from '../templates/templateDefinitions'
import { IMAGE_MIN, GAP, PAGE_IMAGE_COUNT, PHOTO_ROTATION } from '../utils/constants'
import { calculateContentTextHeight } from './imageAnalyzer'

// 计算图片在slot中的缩放和位置（不裁剪，居中显示）
export function calculateImagePlacement(
  contentUnit: ContentUnit,
  slot: Slot,
  rotation: number = 0
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

    return createPlacement(contentUnit, slot, imageAreaHeight, textAreaHeight, rotation)
  }

  return createPlacement(contentUnit, slot, availableImageHeight, textHeight, rotation)
}

function createPlacement(
  contentUnit: ContentUnit,
  slot: Slot,
  imageAreaHeight: number,
  textAreaHeight: number,
  rotation: number
): ImagePlacement {
  const { image } = contentUnit
  const fit = calculateRotatedFit(image.width, image.height, slot.width, imageAreaHeight, rotation)

  return {
    contentUnit,
    slot,
    rotation,
    imageArea: {
      x: slot.x + (slot.width - fit.width) / 2,
      y: slot.y + (imageAreaHeight - fit.height) / 2,
      width: fit.width,
      height: fit.height
    },
    textArea: {
      x: slot.x,
      y: slot.y + imageAreaHeight + GAP.VERTICAL,
      width: slot.width,
      height: textAreaHeight
    },
    scale: fit.scale
  }
}

function calculateRotatedFit(
  imageWidth: number,
  imageHeight: number,
  slotWidth: number,
  slotHeight: number,
  rotation: number
): { width: number; height: number; scale: number; utilization: number; ratioScore: number } {
  const angle = Math.abs(rotation) * Math.PI / 180
  const boundWidth = imageWidth * Math.cos(angle) + imageHeight * Math.sin(angle)
  const boundHeight = imageWidth * Math.sin(angle) + imageHeight * Math.cos(angle)
  const scale = Math.min(slotWidth / boundWidth, slotHeight / boundHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale
  const usedArea = width * height
  const slotArea = slotWidth * slotHeight
  const utilization = usedArea / slotArea
  const rotatedRatio = boundWidth / boundHeight
  const slotRatio = slotWidth / slotHeight
  const ratioDiff = Math.abs(rotatedRatio - slotRatio) / Math.max(rotatedRatio, slotRatio)
  const ratioScore = 1 - Math.min(ratioDiff, 1)

  return { width, height, scale, utilization, ratioScore }
}

function isLandscape(unit: ContentUnit): boolean {
  return unit.image.ratio > 1.2
}

function isPortrait(unit: ContentUnit): boolean {
  return unit.image.ratio < 0.8
}

function hasMixedOrientation(contentUnits: ContentUnit[]): boolean {
  return contentUnits.some(isLandscape) && contentUnits.some(isPortrait)
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function getRotationSign(unit: ContentUnit, slotIndex: number): 1 | -1 {
  return (hashString(`${unit.id}-${slotIndex}`) % 2 === 0) ? 1 : -1
}

function chooseRotationForSlot(
  unit: ContentUnit,
  slot: Slot,
  imageAreaHeight: number,
  allowRotation: boolean,
  slotIndex: number
): number {
  if (!allowRotation) return 0

  const baseFit = calculateRotatedFit(unit.image.width, unit.image.height, slot.width, imageAreaHeight, 0)
  let bestRotation = 0
  let bestUtilization = baseFit.utilization

  for (const candidate of PHOTO_ROTATION.CANDIDATE_DEGREES) {
    if (candidate === 0 || Math.abs(candidate) > PHOTO_ROTATION.MAX_DEGREES) continue

    const fit = calculateRotatedFit(
      unit.image.width,
      unit.image.height,
      slot.width,
      imageAreaHeight,
      candidate
    )

    if (fit.utilization > bestUtilization) {
      bestUtilization = fit.utilization
      bestRotation = Math.abs(candidate)
    }
  }

  if (bestUtilization - baseFit.utilization < PHOTO_ROTATION.MIN_GAIN_TO_ROTATE) {
    return 0
  }

  return bestRotation * getRotationSign(unit, slotIndex)
}

// 计算模板适配得分
export function calculateFitScore(
  contentUnits: ContentUnit[],
  template: Template,
  allowRotation: boolean = false
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

    const rotation = chooseRotationForSlot(unit, slot, availableHeight, allowRotation, i)
    const fit = calculateRotatedFit(
      unit.image.width,
      unit.image.height,
      slot.width,
      availableHeight,
      rotation
    )

    // 综合得分: 60%空间利用率 + 40%比例匹配度
    totalScore += fit.utilization * 0.6 + fit.ratioScore * 0.4
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
  rotations: number[]
}

function findBestPageAssignment(
  remaining: ContentUnit[],
  targetCount: number
): PageAssignment | null {
  if (remaining.length === 0) {
    return null
  }

  let bestResult: PageAssignment | null = null

  const maxCount = Math.min(PAGE_IMAGE_COUNT.MAX, remaining.length)
  const countOrder = buildCountOrder(targetCount, maxCount)

  for (const count of countOrder) {
    const templates = getTemplatesForCount(count)
    if (templates.length === 0) continue

    const candidates = generateCandidates(remaining, count)

    for (const template of templates) {
      for (const candidate of candidates) {
        const allowRotation = hasMixedOrientation(candidate)
        if (!canFitInTemplate(candidate, template)) {
          continue
        }

        const score = calculateFitScore(candidate, template, allowRotation)

        const targetDistancePenalty = Math.abs(count - targetCount) * 0.08
        const adjustedScore = score - targetDistancePenalty

        if (!bestResult || adjustedScore > bestResult.score) {
          bestResult = {
            template,
            units: candidate,
            score: adjustedScore,
            rotations: candidate.map((unit, idx) => {
              const slot = template.slots[idx]
              const textHeight = calculateContentTextHeight(unit.text.title, unit.text.description, slot.width)
              const availableHeight = slot.height - textHeight - GAP.VERTICAL
              return chooseRotationForSlot(unit, slot, availableHeight, allowRotation, idx)
            })
          }
        }
      }
    }
  }

  return bestResult
}

function buildCountOrder(targetCount: number, maxCount: number): number[] {
  const counts: number[] = []
  for (let distance = 0; distance <= maxCount; distance++) {
    const lower = targetCount - distance
    const higher = targetCount + distance
    if (lower >= 1 && lower <= maxCount) counts.push(lower)
    if (higher !== lower && higher >= 1 && higher <= maxCount) counts.push(higher)
  }
  return counts
}

function chooseRandomPageCount(remainingCount: number): number {
  if (remainingCount <= PAGE_IMAGE_COUNT.SINGLE_REMAINING_THRESHOLD) {
    return remainingCount
  }

  const max = Math.min(PAGE_IMAGE_COUNT.MAX, remainingCount)
  const min = Math.min(PAGE_IMAGE_COUNT.MIN, max)
  const preferredMax = max > min ? Math.min(max, PAGE_IMAGE_COUNT.MAX - 1) : max
  return Math.floor(Math.random() * (preferredMax - min + 1)) + min
}

// 主布局算法：将所有内容单元分配到页面
export function layoutContentUnits(contentUnits: ContentUnit[]): LayoutResult {
  const pages: PageLayout[] = []
  const remaining = [...contentUnits]

  while (remaining.length > 0) {
    const targetCount = chooseRandomPageCount(remaining.length)
    const result = findBestPageAssignment(remaining, targetCount)

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
        calculateImagePlacement(unit, result.template.slots[idx], result.rotations[idx] ?? 0)
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
