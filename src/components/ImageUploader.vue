<script setup lang="ts">
import { ref } from 'vue'
import type { ImageInfo, ContentUnit } from '../types'
import { ImageCategory } from '../types'

const emit = defineEmits<{
  upload: [units: ContentUnit[]]
}>()

const isDragging = ref(false)
const isLoading = ref(false)
const progress = ref(0)

function classifyRatio(ratio: number): ImageCategory {
  if (ratio > 1.8) return ImageCategory.WIDE_LANDSCAPE
  if (ratio > 1.2) return ImageCategory.NORMAL_LANDSCAPE
  if (ratio >= 0.8) return ImageCategory.SQUARE
  if (ratio >= 0.6) return ImageCategory.NORMAL_PORTRAIT
  return ImageCategory.TALL_PORTRAIT
}

async function handleFiles(files: FileList | File[]) {
  const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'))

  if (imageFiles.length === 0) return

  isLoading.value = true
  progress.value = 0

  try {
    const images: ImageInfo[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const reader = new FileReader()

      const imageInfo = await new Promise<ImageInfo>((resolve, reject) => {
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          const img = new Image()

          img.onload = () => {
            resolve({
              id: `img_${Date.now()}_${i}`,
              file,
              dataUrl,
              width: img.naturalWidth,
              height: img.naturalHeight,
              ratio: img.naturalWidth / img.naturalHeight,
              category: classifyRatio(img.naturalWidth / img.naturalHeight)
            })
          }
          img.onerror = reject
          img.src = dataUrl
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      images.push(imageInfo)
      progress.value = Math.round(((i + 1) / imageFiles.length) * 100)
    }

    // 转换为ContentUnit，默认使用文件名作为标题
    const units: ContentUnit[] = images.map((img) => ({
      id: img.id,
      image: img,
      text: {
        title: img.file.name.replace(/\.[^.]+$/, ''),
        description: ''
      }
    }))

    emit('upload', units)
  } catch (error) {
    console.error('Failed to load images:', error)
    alert('部分图片加载失败，请重试')
  } finally {
    isLoading.value = false
  }
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  if (e.dataTransfer?.files) {
    handleFiles(e.dataTransfer.files)
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) {
    handleFiles(input.files)
  }
}
</script>

<template>
  <div
    class="uploader"
    :class="{ dragging: isDragging, loading: isLoading }"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
  >
    <template v-if="isLoading">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>正在加载图片... {{ progress }}%</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="upload-content">
        <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="upload-text">拖拽图片到这里，或点击选择文件</p>
        <p class="upload-hint">支持 JPG、PNG 格式，可一次上传多张图片</p>
        <input
          type="file"
          multiple
          accept="image/*"
          class="file-input"
          @change="onFileSelect"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.uploader {
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  position: relative;
}

.uploader:hover,
.uploader.dragging {
  border-color: #409eff;
  background: #ecf5ff;
}

.uploader.loading {
  cursor: default;
}

.upload-content {
  position: relative;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: #909399;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 16px;
  color: #606266;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #909399;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.loading-content {
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.progress-bar {
  width: 100%;
  max-width: 300px;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  margin: 12px auto 0;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}
</style>
