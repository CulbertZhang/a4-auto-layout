// 图片分类
export const ImageCategory = {
  WIDE_LANDSCAPE: 'WIDE_LANDSCAPE',
  NORMAL_LANDSCAPE: 'NORMAL_LANDSCAPE',
  SQUARE: 'SQUARE',
  NORMAL_PORTRAIT: 'NORMAL_PORTRAIT',
  TALL_PORTRAIT: 'TALL_PORTRAIT'
} as const

export type ImageCategory = typeof ImageCategory[keyof typeof ImageCategory]

// 内容单元：图片 + 文字
export interface ContentUnit {
  id: string
  image: ImageInfo
  text: TextInfo
  textHeight?: number // 计算后的文字渲染高度
}

// 图片信息
export interface ImageInfo {
  id: string
  file: File
  objectUrl: string // blob URL for preview display
  width: number
  height: number
  ratio: number   // width / height
  category: ImageCategory
}

// 文字信息
export interface TextInfo {
  title: string
  description: string
}

// 布局槽位
export interface Slot {
  x: number
  y: number
  width: number
  height: number
}

// 布局模板
export interface Template {
  id: string
  name: string
  slotCount: number
  slots: Slot[]
  preferredCategories: ImageCategory[] // 适合的图片类型
}

// 图片在页面中的位置
export interface ImagePlacement {
  contentUnit: ContentUnit
  slot: Slot
  rotation: number
  imageArea: {
    x: number
    y: number
    width: number
    height: number
  }
  textArea: {
    x: number
    y: number
    width: number
    height: number
  }
  scale: number
}

// 页面布局结果
export interface PageLayout {
  pageIndex: number
  template: Template
  placements: ImagePlacement[]
}

// 排版结果
export interface LayoutResult {
  pages: PageLayout[]
  totalImages: number
  totalPages: number
}
