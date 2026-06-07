import type { Template } from '../types'
import { ImageCategory } from '../types'
import { CONTENT, GAP } from '../utils/constants'

const W = CONTENT.WIDTH
const H = CONTENT.HEIGHT
const HG = GAP.HORIZONTAL
const VG = GAP.VERTICAL

// 模板1: 单图布局
export const TEMPLATE_1: Template = {
  id: 'T1',
  name: '单图布局',
  slotCount: 1,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: W, height: H }
  ],
  preferredCategories: [ImageCategory.WIDE_LANDSCAPE, ImageCategory.TALL_PORTRAIT]
}

// 模板2A: 双横图上下排列
const slot2AHeight = (H - VG) / 2
export const TEMPLATE_2A: Template = {
  id: 'T2A',
  name: '双横图上下',
  slotCount: 2,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: W, height: slot2AHeight },
    { x: CONTENT.X, y: CONTENT.Y + slot2AHeight + VG, width: W, height: slot2AHeight }
  ],
  preferredCategories: [ImageCategory.WIDE_LANDSCAPE, ImageCategory.NORMAL_LANDSCAPE]
}

// 模板2B: 双竖图左右排列
const slot2BWidth = (W - HG) / 2
export const TEMPLATE_2B: Template = {
  id: 'T2B',
  name: '双竖图左右',
  slotCount: 2,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: slot2BWidth, height: H },
    { x: CONTENT.X + slot2BWidth + HG, y: CONTENT.Y, width: slot2BWidth, height: H }
  ],
  preferredCategories: [ImageCategory.NORMAL_PORTRAIT, ImageCategory.TALL_PORTRAIT]
}

// 模板3A: 1大2小布局 (1横图上 + 2竖图下)
const slot3ATopHeight = H * 0.45
const slot3ABottomHeight = H - slot3ATopHeight - VG
const slot3ABottomWidth = (W - HG) / 2
export const TEMPLATE_3A: Template = {
  id: 'T3A',
  name: '1大2小',
  slotCount: 3,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: W, height: slot3ATopHeight },
    { x: CONTENT.X, y: CONTENT.Y + slot3ATopHeight + VG, width: slot3ABottomWidth, height: slot3ABottomHeight },
    { x: CONTENT.X + slot3ABottomWidth + HG, y: CONTENT.Y + slot3ATopHeight + VG, width: slot3ABottomWidth, height: slot3ABottomHeight }
  ],
  preferredCategories: [ImageCategory.NORMAL_LANDSCAPE, ImageCategory.SQUARE]
}

// 模板4: 2x2网格布局
const slot4Width = (W - HG) / 2
const slot4Height = (H - VG) / 2
export const TEMPLATE_4: Template = {
  id: 'T4',
  name: '2x2网格',
  slotCount: 4,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: slot4Width, height: slot4Height },
    { x: CONTENT.X + slot4Width + HG, y: CONTENT.Y, width: slot4Width, height: slot4Height },
    { x: CONTENT.X, y: CONTENT.Y + slot4Height + VG, width: slot4Width, height: slot4Height },
    { x: CONTENT.X + slot4Width + HG, y: CONTENT.Y + slot4Height + VG, width: slot4Width, height: slot4Height }
  ],
  preferredCategories: [ImageCategory.SQUARE, ImageCategory.NORMAL_LANDSCAPE, ImageCategory.NORMAL_PORTRAIT]
}

// 模板5: 2+3混合布局
const slot5TopHeight = H * 0.45
const slot5BottomHeight = H - slot5TopHeight - VG
const slot5TopWidth = (W - HG) / 2
const slot5BottomWidth = (W - HG * 2) / 3
export const TEMPLATE_5: Template = {
  id: 'T5',
  name: '2+3混合',
  slotCount: 5,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: slot5TopWidth, height: slot5TopHeight },
    { x: CONTENT.X + slot5TopWidth + HG, y: CONTENT.Y, width: slot5TopWidth, height: slot5TopHeight },
    { x: CONTENT.X, y: CONTENT.Y + slot5TopHeight + VG, width: slot5BottomWidth, height: slot5BottomHeight },
    { x: CONTENT.X + slot5BottomWidth + HG, y: CONTENT.Y + slot5TopHeight + VG, width: slot5BottomWidth, height: slot5BottomHeight },
    { x: CONTENT.X + (slot5BottomWidth + HG) * 2, y: CONTENT.Y + slot5TopHeight + VG, width: slot5BottomWidth, height: slot5BottomHeight }
  ],
  preferredCategories: [ImageCategory.SQUARE, ImageCategory.NORMAL_PORTRAIT]
}

// 模板6A: 2x3网格 (竖图为主)
const slot6AWidth = (W - HG * 2) / 3
const slot6AHeight = (H - VG) / 2
export const TEMPLATE_6A: Template = {
  id: 'T6A',
  name: '2x3网格(竖)',
  slotCount: 6,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: slot6AWidth, height: slot6AHeight },
    { x: CONTENT.X + slot6AWidth + HG, y: CONTENT.Y, width: slot6AWidth, height: slot6AHeight },
    { x: CONTENT.X + (slot6AWidth + HG) * 2, y: CONTENT.Y, width: slot6AWidth, height: slot6AHeight },
    { x: CONTENT.X, y: CONTENT.Y + slot6AHeight + VG, width: slot6AWidth, height: slot6AHeight },
    { x: CONTENT.X + slot6AWidth + HG, y: CONTENT.Y + slot6AHeight + VG, width: slot6AWidth, height: slot6AHeight },
    { x: CONTENT.X + (slot6AWidth + HG) * 2, y: CONTENT.Y + slot6AHeight + VG, width: slot6AWidth, height: slot6AHeight }
  ],
  preferredCategories: [ImageCategory.NORMAL_PORTRAIT, ImageCategory.SQUARE]
}

// 模板6B: 3x2网格 (横图为主)
const slot6BWidth = (W - HG) / 2
const slot6BHeight = (H - VG * 2) / 3
export const TEMPLATE_6B: Template = {
  id: 'T6B',
  name: '3x2网格(横)',
  slotCount: 6,
  slots: [
    { x: CONTENT.X, y: CONTENT.Y, width: slot6BWidth, height: slot6BHeight },
    { x: CONTENT.X + slot6BWidth + HG, y: CONTENT.Y, width: slot6BWidth, height: slot6BHeight },
    { x: CONTENT.X, y: CONTENT.Y + slot6BHeight + VG, width: slot6BWidth, height: slot6BHeight },
    { x: CONTENT.X + slot6BWidth + HG, y: CONTENT.Y + slot6BHeight + VG, width: slot6BWidth, height: slot6BHeight },
    { x: CONTENT.X, y: CONTENT.Y + (slot6BHeight + VG) * 2, width: slot6BWidth, height: slot6BHeight },
    { x: CONTENT.X + slot6BWidth + HG, y: CONTENT.Y + (slot6BHeight + VG) * 2, width: slot6BWidth, height: slot6BHeight }
  ],
  preferredCategories: [ImageCategory.NORMAL_LANDSCAPE, ImageCategory.WIDE_LANDSCAPE]
}

// 所有模板列表
export const ALL_TEMPLATES: Template[] = [
  TEMPLATE_1,
  TEMPLATE_2A,
  TEMPLATE_2B,
  TEMPLATE_3A,
  TEMPLATE_4,
  TEMPLATE_5,
  TEMPLATE_6A,
  TEMPLATE_6B
]

// 根据图片数量获取可用模板
export function getTemplatesForCount(count: number): Template[] {
  return ALL_TEMPLATES.filter(t => t.slotCount === count)
}

// 根据图片类型获取推荐模板
export function getRecommendedTemplates(categories: ImageCategory[]): Template[] {
  const scores = ALL_TEMPLATES.map(template => {
    let score = 0
    for (const cat of categories) {
      if (template.preferredCategories.includes(cat)) {
        score++
      }
    }
    return { template, score }
  })

  scores.sort((a, b) => b.score - a.score)
  return scores.map(s => s.template)
}
