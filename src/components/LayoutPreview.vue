<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ContentUnit, LayoutResult } from '../types'
import { layoutContentUnits } from '../core/layoutEngine'
import { exportToPDF } from '../export/pdfRenderer'
import PageViewer from './PageViewer.vue'

const props = defineProps<{
  contentUnits: ContentUnit[]
}>()

const emit = defineEmits<{
  back: []
}>()

const isExporting = ref(false)
const currentPage = ref(0)
const previewScale = ref(0.2)

const layoutResult = computed<LayoutResult>(() => {
  return layoutContentUnits(props.contentUnits)
})

const currentPageData = computed(() => {
  return layoutResult.value.pages[currentPage.value]
})

function prevPage() {
  if (currentPage.value > 0) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < layoutResult.value.totalPages - 1) {
    currentPage.value++
  }
}

async function handleExport() {
  isExporting.value = true
  try {
    await exportToPDF(layoutResult.value, `相册_${Date.now()}.pdf`)
  } catch (error) {
    console.error('Export failed:', error)
    alert('导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <div class="layout-preview">
    <!-- 头部信息 -->
    <div class="header">
      <button class="btn btn-text" @click="emit('back')">
        ← 返回上传
      </button>
      <div class="stats">
        <span>共 {{ layoutResult.totalImages }} 张图片</span>
        <span class="divider">|</span>
        <span>{{ layoutResult.totalPages }} 页</span>
      </div>
      <button
        class="btn btn-primary"
        :disabled="isExporting"
        @click="handleExport"
      >
        {{ isExporting ? '导出中...' : '导出PDF' }}
      </button>
    </div>

    <!-- 预览区域 -->
    <div class="preview-container">
      <!-- 缩略图列表 -->
      <div class="thumbnail-list">
        <div
          v-for="(page, idx) in layoutResult.pages"
          :key="idx"
          class="thumbnail"
          :class="{ active: idx === currentPage }"
          @click="currentPage = idx"
        >
          <PageViewer :page="page" :scale="0.08" />
          <span class="thumb-number">{{ idx + 1 }}</span>
        </div>
      </div>

      <!-- 主预览 -->
      <div class="main-preview">
        <div class="page-wrapper">
          <PageViewer
            v-if="currentPageData"
            :page="currentPageData"
            :scale="previewScale"
          />
        </div>

        <!-- 翻页控制 -->
        <div class="page-controls">
          <button
            class="btn btn-icon"
            :disabled="currentPage === 0"
            @click="prevPage"
          >
            ‹
          </button>
          <span class="page-info">
            {{ currentPage + 1 }} / {{ layoutResult.totalPages }}
          </span>
          <button
            class="btn btn-icon"
            :disabled="currentPage >= layoutResult.totalPages - 1"
            @click="nextPage"
          >
            ›
          </button>
        </div>

        <!-- 缩放控制 -->
        <div class="zoom-controls">
          <button class="btn btn-small" @click="previewScale = Math.max(0.1, previewScale - 0.05)">-</button>
          <span>{{ Math.round(previewScale * 100) }}%</span>
          <button class="btn btn-small" @click="previewScale = Math.min(0.5, previewScale + 0.05)">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.stats {
  color: #606266;
  font-size: 14px;
}

.stats .divider {
  margin: 0 8px;
  color: #dcdfe6;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-text {
  background: none;
  color: #606266;
}

.btn-text:hover:not(:disabled) {
  color: #409eff;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 20px;
  background: white;
  border: 1px solid #dcdfe6;
}

.btn-icon:hover:not(:disabled) {
  border-color: #409eff;
  color: #409eff;
}

.btn-small {
  width: 28px;
  height: 28px;
  padding: 0;
  background: white;
  border: 1px solid #dcdfe6;
}

.preview-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: #f0f2f5;
}

.thumbnail-list {
  width: 120px;
  padding: 16px 8px;
  overflow-y: auto;
  background: white;
  border-right: 1px solid #e4e7ed;
}

.thumbnail {
  margin-bottom: 12px;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  border-radius: 4px;
  overflow: hidden;
}

.thumbnail.active {
  border-color: #409eff;
}

.thumb-number {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 2px;
}

.main-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  overflow: auto;
}

.page-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.page-info {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
  text-align: center;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 12px;
  color: #909399;
}
</style>
