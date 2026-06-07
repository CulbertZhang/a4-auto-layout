// A4页面规格 (300 DPI)
export const A4 = {
  WIDTH: 2480,   // 210mm
  HEIGHT: 3508,  // 297mm
  DPI: 300
} as const

// 页边距 (10mm)
export const MARGIN = {
  TOP: 118,
  BOTTOM: 118,
  LEFT: 118,
  RIGHT: 118
} as const

// 可用内容区域
export const CONTENT = {
  WIDTH: A4.WIDTH - MARGIN.LEFT - MARGIN.RIGHT,   // 2244px
  HEIGHT: A4.HEIGHT - MARGIN.TOP - MARGIN.BOTTOM, // 3272px
  X: MARGIN.LEFT,
  Y: MARGIN.TOP
} as const

// 间距
export const GAP = {
  HORIZONTAL: 60, // 5mm
  VERTICAL: 60    // 5mm
} as const

// 文字配置
export const TEXT_CONFIG = {
  TITLE_FONT_SIZE: 24,
  DESC_FONT_SIZE: 18,
  LINE_HEIGHT: 1.5,
  PADDING: 10,
  FONT_FAMILY: 'sans-serif'
} as const

// 图片最小尺寸限制
export const IMAGE_MIN = {
  WIDTH: 300,
  HEIGHT: 200
} as const

// 每页照片数随机分配范围
export const PAGE_IMAGE_COUNT = {
  MIN: 3,
  MAX: 6,
  SINGLE_REMAINING_THRESHOLD: 2
} as const

// 混合横竖照片时允许小角度旋转，以提升空白区域利用率
export const PHOTO_ROTATION = {
  MAX_DEGREES: 45,
  CANDIDATE_DEGREES: [-45, -30, -15, 0, 15, 30, 45],
  MIN_GAIN_TO_ROTATE: 0.05
} as const

// 宽高比分类阈值
export const RATIO_THRESHOLD = {
  WIDE_LANDSCAPE: 1.8,
  LANDSCAPE: 1.2,
  PORTRAIT: 0.8,
  TALL_PORTRAIT: 0.6
} as const
