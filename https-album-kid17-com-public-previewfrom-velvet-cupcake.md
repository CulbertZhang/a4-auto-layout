# 图片自动A4排版系统实现计划

## Context

用户需要为类似 album.kid17.com 的幼儿成长档案H5页面实现自动A4排版功能。核心需求是：用户上传约200张图片，系统自动将图片按照A4页面格式进行智能排版，每页最多6张图片，图片不裁剪只缩放，同时包含文字信息。

---

## 一、技术方案概述

### 核心挑战
1. **图片尺寸多样**：横图、竖图、方图混合，宽高比差异大
2. **空间利用率**：在不裁剪的前提下最大化利用A4页面空间
3. **智能分组**：200张图片如何合理分配到约34-40个页面
4. **美观性**：避免大量留白，保持视觉平衡

### 解决思路
采用**模板匹配 + 贪心优化**策略：
1. 预定义多种布局模板（1-6张图片的不同排列方式）
2. 根据图片宽高比分类（横图/竖图/方图）
3. 为每组图片匹配最佳模板，计算适配得分
4. 贪心选择得分最高的组合

---

## 二、A4页面规格定义

```
A4尺寸 (300 DPI):
- 宽度: 2480px (210mm)
- 高度: 3508px (297mm)

页边距:
- 上下左右各: 118px (10mm)

可用内容区域:
- 宽度: 2244px (190mm)
- 高度: 3272px (277mm)

图片间距: 60px (5mm)
文字区域高度: 动态计算（根据文字内容自适应）
```

---

## 三、图片分类规则

按宽高比(ratio = width/height)分类：

| 分类 | 宽高比范围 | 典型场景 |
|------|-----------|---------|
| 超宽横图 | > 1.8 | 全景图、16:9视频截图 |
| 普通横图 | 1.2 ~ 1.8 | 普通相机横拍 |
| 方图 | 0.8 ~ 1.2 | 1:1正方形图片 |
| 普通竖图 | 0.6 ~ 0.8 | 普通相机竖拍 |
| 超高竖图 | < 0.6 | 9:16手机竖屏截图 |

---

## 四、布局模板设计

### 模板1: 单图布局
```
+------------------------+
|       [图片区域]        |
|     (占满宽度)          |
+------------------------+
|       [文字区域]        |
+------------------------+
适用: 重要照片、高清大图
```

### 模板2A: 双横图上下排列
```
+------------------------+
|       [图片1]          |
|       [文字1]          |
+------------------------+
|       [图片2]          |
|       [文字2]          |
+------------------------+
适用: 两张横图
```

### 模板2B: 双竖图左右排列
```
+----------+----+----------+
|  [图片1]  |    |  [图片2]  |
|          |    |          |
|  [文字1]  |    |  [文字2]  |
+----------+----+----------+
适用: 两张竖图
```

### 模板3A: 1大2小布局
```
+------------------------+
|       [图片1-大]        |
|       [文字1]          |
+----------+----+----------+
|  [图片2]  |    |  [图片3]  |
|  [文字2]  |    |  [文字3]  |
+----------+----+----------+
适用: 1横图 + 2竖图/方图
```

### 模板4: 2x2网格布局
```
+----------+----+----------+
|  [图片1]  |    |  [图片2]  |
|  [文字1]  |    |  [文字2]  |
+----------+----+----------+
|  [图片3]  |    |  [图片4]  |
|  [文字3]  |    |  [文字4]  |
+----------+----+----------+
适用: 4张相似比例图片
```

### 模板5: 2+3混合布局
```
+----------+----+----------+
|  [图片1]  |    |  [图片2]  |
|  [文字1]  |    |  [文字2]  |
+-------+-------+-------+
| [图3] |  [图4] | [图5] |
| [字3] |  [字4] | [字5] |
+-------+-------+-------+
适用: 5张混合图片
```

### 模板6A: 2x3网格 (竖图为主)
```
+-------+---+-------+---+-------+
| [图1] |   | [图2] |   | [图3] |
| [字1] |   | [字2] |   | [字3] |
+-------+---+-------+---+-------+
| [图4] |   | [图5] |   | [图6] |
| [字4] |   | [字5] |   | [字6] |
+-------+---+-------+---+-------+
适用: 6张竖图或方图
```

### 模板6B: 3x2网格 (横图为主)
```
+----------+----+----------+
|  [图片1]  |    |  [图片2]  |
|  [文字1]  |    |  [文字2]  |
+----------+----+----------+
|  [图片3]  |    |  [图片4]  |
|  [文字3]  |    |  [文字4]  |
+----------+----+----------+
|  [图片5]  |    |  [图片6]  |
|  [文字5]  |    |  [文字6]  |
+----------+----+----------+
适用: 6张横图
```

---

## 五、核心算法流程（文字优先）

```
┌─────────────────────────────────────┐
│  输入: 200张图片 + 文字信息          │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 1: 数据预处理                  │
│  - 读取每张图片尺寸和宽高比          │
│  - 计算每条文字的渲染高度            │
│  - 将图片+文字打包为内容单元          │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 2: 内容单元排序                │
│  - 按宽高比分类（横/竖/方）          │
│  - 相似比例的图片聚合在一起          │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 3: 逐页贪心填充                │
│  对于每个新页面:                     │
│  ┌─────────────────────────────────┐│
│  │ 3.1 初始化可用高度 = 页面高度    ││
│  │ 3.2 尝试添加下一个内容单元       ││
│  │ 3.3 计算: 文字高度 + 图片高度    ││
│  │ 3.4 如果能放下且图片≥最小尺寸:   ││
│  │     - 添加到当前页               ││
│  │     - 更新剩余高度               ││
│  │ 3.5 如果放不下或已达6张:         ││
│  │     - 结束当前页，开始新页       ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 4: 页内布局优化                │
│  - 根据当前页图片数量选择模板        │
│  - 计算每张图片的最终尺寸和位置      │
│  - 文字区域紧贴图片下方              │
└─────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Step 5: 渲染输出PDF                 │
└─────────────────────────────────────┘
```

---

## 六、文字优先排版策略（核心变更）

### 设计原则
**文字全量显示，图片自适应填充剩余空间**

### 排版流程
```
1. 计算文字区域高度（根据内容动态计算）
2. 计算剩余可用图片区域
3. 在剩余空间内排版图片（不裁剪，按比例缩放）
```

### 文字区域计算

```javascript
// 文字渲染参数
const TEXT_CONFIG = {
  titleFontSize: 24,      // 标题字号
  descFontSize: 18,       // 描述字号
  lineHeight: 1.5,        // 行高
  padding: 10,            // 上下内边距
  maxWidth: null          // 由slot宽度决定
};

function calculateTextHeight(text, fontSize, maxWidth) {
  // 使用Canvas测量文字宽度
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px sans-serif`;
  
  // 按词分割并计算换行
  const words = text.split('');
  let lines = 1;
  let currentLineWidth = 0;
  
  for (const char of words) {
    const charWidth = ctx.measureText(char).width;
    if (currentLineWidth + charWidth > maxWidth) {
      lines++;
      currentLineWidth = charWidth;
    } else {
      currentLineWidth += charWidth;
    }
  }
  
  return lines * fontSize * TEXT_CONFIG.lineHeight + TEXT_CONFIG.padding * 2;
}

function calculateTotalTextHeight(title, description, slotWidth) {
  const titleHeight = calculateTextHeight(title, TEXT_CONFIG.titleFontSize, slotWidth);
  const descHeight = calculateTextHeight(description, TEXT_CONFIG.descFontSize, slotWidth);
  return titleHeight + descHeight;
}
```

### 图片区域动态计算

```javascript
function calculateImageSlot(originalSlot, textHeight) {
  return {
    x: originalSlot.x,
    y: originalSlot.y,
    width: originalSlot.width,
    height: originalSlot.height - textHeight  // 减去文字占用的高度
  };
}
```

### 页面分配策略变更

```
原策略: 固定每页最多6张图片
新策略: 根据文字量动态决定每页图片数量

步骤:
1. 预估当前页面可容纳的图片数（初始假设6张）
2. 计算所有文字的总高度
3. 如果文字+图片超出页面高度:
   - 减少图片数量
   - 重新计算布局
4. 重复直到内容适配页面
```

### 极端情况处理

| 情况 | 处理方式 |
|------|---------|
| 单张图片文字过长 | 文字区域可占用整页，图片缩小到最小可接受尺寸 |
| 文字超过整页 | 仅显示文字，图片移到下一页 |
| 图片最小尺寸限制 | 宽度不小于300px，高度不小于200px |

---

## 七、适配得分计算（更新版）

```javascript
function calculateFitScore(images, template, textHeights) {
  let score = 0;
  
  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    const img = images[i];
    const textHeight = textHeights[i];
    
    // 扣除文字高度后的可用图片区域
    const availableHeight = slot.height - textHeight;
    if (availableHeight < 200) {
      // 图片区域太小，此模板不适用
      return -1;
    }
    
    const slotRatio = slot.width / availableHeight;
    const imgRatio = img.width / img.height;
    
    // 计算缩放后的空间利用率
    let scale;
    if (imgRatio > slotRatio) {
      scale = slot.width / img.width;
    } else {
      scale = availableHeight / img.height;
    }
    
    const usedArea = (img.width * scale) * (img.height * scale);
    const slotArea = slot.width * availableHeight;
    const utilization = usedArea / slotArea;
    
    // 宽高比相似度
    const ratioDiff = Math.abs(imgRatio - slotRatio) / Math.max(imgRatio, slotRatio);
    const ratioScore = 1 - Math.min(ratioDiff, 1);
    
    score += utilization * 0.6 + ratioScore * 0.4;
  }
  
  return score / template.slots.length;
}
```

---

## 七、图片缩放定位算法

```javascript
function calculatePlacement(image, slot) {
  const imgRatio = image.width / image.height;
  const slotRatio = slot.width / slot.height;
  
  let scale, finalWidth, finalHeight, xOffset, yOffset;
  
  if (imgRatio > slotRatio) {
    // 图片更宽 - 以宽度为基准缩放
    scale = slot.width / image.width;
    finalWidth = slot.width;
    finalHeight = image.height * scale;
    xOffset = 0;
    yOffset = (slot.height - finalHeight) / 2; // 垂直居中
  } else {
    // 图片更高 - 以高度为基准缩放
    scale = slot.height / image.height;
    finalWidth = image.width * scale;
    finalHeight = slot.height;
    xOffset = (slot.width - finalWidth) / 2; // 水平居中
    yOffset = 0;
  }
  
  return {
    x: slot.x + xOffset,
    y: slot.y + yOffset,
    width: finalWidth,
    height: finalHeight,
    scale: scale
  };
}
```

---

## 八、技术选型（Web前端方案）

### 技术栈
```
框架:      Vue 3 + TypeScript
PDF生成:   pdf-lib (纯JS，支持图片嵌入)
图片处理:  Canvas API (缩放、压缩)
UI组件:    Element Plus 或 Ant Design Vue
状态管理:  Pinia
构建工具:  Vite
```

### 关键依赖
```json
{
  "dependencies": {
    "vue": "^3.4",
    "pdf-lib": "^1.17.1",
    "pinia": "^2.1",
    "element-plus": "^2.5"
  }
}
```

### 为什么选择 pdf-lib
- 纯JavaScript实现，无需后端
- 直接操作PDF字节流，性能好
- 支持嵌入图片、设置精确位置和尺寸
- 文件体积小（~200KB gzipped）

---

## 九、项目文件结构

```
src/
├── core/
│   ├── imageAnalyzer.ts      # 图片分析和分类
│   ├── layoutEngine.ts       # 布局引擎，模板匹配
│   ├── scaleCalculator.ts    # 缩放和定位计算
│   └── pageGenerator.ts      # 页面生成器
├── templates/
│   ├── templateDefinitions.ts # 模板定义
│   └── templateSlots.ts       # 各模板的slot尺寸
├── export/
│   ├── pdfRenderer.ts        # PDF渲染导出
│   └── imageRenderer.ts      # 图片序列导出
├── components/
│   ├── ImageUploader.vue     # 图片上传组件
│   ├── LayoutPreview.vue     # 排版预览组件
│   └── PageViewer.vue        # 单页查看器
└── utils/
    ├── imageUtils.ts         # 图片工具函数
    └── constants.ts          # 常量定义
```

---

## 十、实现步骤

### Phase 1: 基础架构 (2-3天)
1. 搭建项目框架，配置TypeScript
2. 定义数据结构和类型
3. 实现A4页面常量和模板定义

### Phase 2: 核心算法 (3-4天)
1. 实现图片分析模块
2. 实现模板匹配和得分计算
3. 实现贪心分组算法
4. 实现缩放定位计算

### Phase 3: 渲染层 (2-3天)
1. 实现Canvas预览渲染
2. 实现PDF导出功能
3. 优化渲染性能

### Phase 4: UI层 (2-3天)
1. 图片上传界面
2. 排版预览和调整界面
3. 导出和分享功能

### Phase 5: 优化和测试 (2天)
1. 性能优化 (大量图片处理)
2. 边界情况处理
3. 用户体验优化

**预计总工期**: 11-15天

---

## 十一、验证方案

1. **单元测试**: 
   - 文字高度计算准确性（多行文字、中英文混合）
   - 图片分类和缩放算法正确性
2. **集成测试**: 
   - 上传200张不同比例的测试图片
   - 配合长短不一的文字内容
   - 验证所有文字完整显示、图片无裁剪
3. **边界测试**:
   - 超长文字（500字以上描述）
   - 极端比例图片（全景图、长截图）
   - 空文字情况
4. **视觉验证**: 
   - 检查文字是否完整显示（不截断）
   - 检查图片是否被裁剪（不应该）
   - 检查空间利用率
5. **性能测试**: 200张图片的处理时间应 < 10秒

---

## 十二、注意事项

1. **图片加载**: 大量图片需要懒加载，避免内存溢出
2. **分辨率**: 导出PDF时需要300DPI，预览时可降采样
3. **文字截断**: 标题超过30字符、描述超过80字符需截断加省略号
4. **保持顺序**: 可选功能，允许用户选择是否保持原始上传顺序

---

## 十三、变更记录

### 2026-06-07 第一次实现后优化

#### 1. 中文字体支持
- **问题**: PDF导出使用 `StandardFonts.Helvetica`，无法渲染中文字符
- **方案**: 引入 `@pdf-lib/fontkit`，从 Google Fonts CDN 加载 Noto Sans SC 字体，内存缓存避免重复下载
- **文件**: `src/export/pdfRenderer.ts`

#### 2. 内存优化 — Object URL 替代 Base64
- **问题**: 200张图片以 base64 data URL 存储，内存占用可达 1.3GB+
- **方案**: 预览阶段使用 `URL.createObjectURL()` 生成轻量指针，PDF导出时通过 `file.arrayBuffer()` 按需读取原始数据
- **文件**: `src/types/index.ts`（`dataUrl` → `objectUrl`）、`src/components/ImageUploader.vue`、`src/components/PageViewer.vue`、`src/core/imageAnalyzer.ts`、`src/export/pdfRenderer.ts`

#### 3. 批量加载与事件循环让出
- **问题**: 200张图片串行加载时UI卡死
- **方案**: 每批20张并发加载，批次间 `setTimeout(0)` 让出事件循环
- **文件**: `src/components/ImageUploader.vue`

#### 4. PDF导出模块懒加载（Code Splitting）
- **问题**: pdf-lib + fontkit 使主包体积达 1.2MB
- **方案**: `LayoutPreview.vue` 中使用动态 `import()` 延迟加载导出模块，主包降至 74KB，PDF模块仅在用户点击导出时加载
- **文件**: `src/components/LayoutPreview.vue`

#### 5. 导出进度反馈
- **问题**: 大量页面导出时用户无反馈
- **方案**: `generatePDF` 增加 `onProgress` 回调，LayoutPreview 显示逐页进度（"正在生成 3/40 页..."）
- **文件**: `src/export/pdfRenderer.ts`、`src/components/LayoutPreview.vue`

#### 6. 修复图片多选后丢失的问题
- **问题**: `Promise.all` 的 fail-fast 行为导致批次中任一图片解码失败（如 HEIC 格式）时，整个批次及后续所有批次全部丢弃，用户丢失大量已选图片
- **方案**: 将 `Promise.all` 替换为 `Promise.allSettled`，单张失败仅跳过该图片，其余正常加载；加载结束后提示用户哪些文件未能加载
- **文件**: `src/components/ImageUploader.vue`

#### 7. 项目清理
- 移除 Vite 模板样板文件（HelloWorld.vue、hero.png、vite.svg、vue.svg）
- `style.css` 替换为适配本项目的最小化重置样式
- `index.html` 修正 `lang="zh-CN"` 和页面标题

### 2026-06-07 第二次修复

#### 8. 修复 PDF 导出失败 — 字体 URL 404
- **问题**: 硬编码的 Google Fonts CDN 字体 URL（Noto Sans SC v37）已返回 404，Google Fonts 更新版本后旧 URL 失效
- **方案**: 改为动态解析方案 + 本地回退
  - 主路径：通过 `https://fonts.googleapis.com/css2?family=Noto+Sans+SC` 动态解析当前有效字体 URL
  - 回退路径：若动态获取失败，使用本地 `/fonts/NotoSansSC-Regular.ttf`
- **文件**: `src/export/pdfRenderer.ts`、`public/fonts/NotoSansSC-Regular.ttf`（新增 17MB 字体文件）

#### 9. 改善 PDF 导出图片嵌入容错
- **问题**: 单张图片嵌入失败（如格式不支持）会中断整个 PDF 导出
- **方案**: 在 `generatePDF` 的图片渲染循环中添加 try/catch，失败时打印警告并跳过，不中断后续页面生成
- **文件**: `src/export/pdfRenderer.ts`

### 2026-06-07 第三次调整

#### 10. 每页照片数量随机分配
- **问题**: 原布局引擎从6张模板开始尝试，并给图片数量更多的模板额外加分，导致页面倾向于一律按每页6张排版，视觉节奏单一
- **方案**: 新增随机页容量策略，每页先生成目标照片数，再围绕目标数量寻找最佳模板
  - 默认目标范围优先为3-5张
  - 6张仍作为模板适配回退，避免极端情况下无法合理排版
  - 剩余1-2张时按实际剩余数量收尾
- **配置**: `PAGE_IMAGE_COUNT.MIN = 3`、`PAGE_IMAGE_COUNT.MAX = 6`、`PAGE_IMAGE_COUNT.SINGLE_REMAINING_THRESHOLD = 2`
- **文件**: `src/core/layoutEngine.ts`、`src/utils/constants.ts`

#### 11. 混合横竖照片时启用旋转适配
- **问题**: 同页同时出现横版和竖版照片时，固定正向摆放容易产生较大空白
- **方案**: 当同一候选页面同时包含横图和竖图时，布局引擎允许照片向左或向右旋转不超过45度，并把旋转后的空间利用率纳入模板评分
  - 候选角度为 `-45`、`-30`、`-15`、`0`、`15`、`30`、`45`
  - 仅当旋转后的空间利用率提升超过阈值时才采用旋转，避免无意义倾斜
  - 旋转方向通过内容单元ID稳定计算，避免同一页面内全部同方向倾斜
- **配置**: `PHOTO_ROTATION.MAX_DEGREES = 45`、`PHOTO_ROTATION.MIN_GAIN_TO_ROTATE = 0.05`
- **文件**: `src/core/layoutEngine.ts`、`src/utils/constants.ts`、`src/types/index.ts`

#### 12. 预览与 PDF 导出同步旋转效果
- **问题**: 旋转信息如果只在布局层生效，会造成页面预览和 PDF 导出不一致
- **方案**: 在 `ImagePlacement` 中新增 `rotation` 字段，预览组件和 PDF 渲染器统一读取该字段
  - 页面预览使用 CSS `transform: rotate(...)`
  - PDF 导出使用 `pdf-lib` 的 `degrees()` 旋转，并按图片中心点修正绘制坐标
- **文件**: `src/types/index.ts`、`src/components/PageViewer.vue`、`src/export/pdfRenderer.ts`
