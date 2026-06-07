<script setup lang="ts">
import { ref } from 'vue'
import type { ContentUnit } from './types'
import ImageUploader from './components/ImageUploader.vue'
import LayoutPreview from './components/LayoutPreview.vue'

const contentUnits = ref<ContentUnit[]>([])
const step = ref<'upload' | 'preview'>('upload')

function handleUpload(units: ContentUnit[]) {
  contentUnits.value = units
  step.value = 'preview'
}

function handleBack() {
  step.value = 'upload'
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>A4 图片自动排版工具</h1>
      <p class="subtitle">上传图片，自动生成A4排版PDF</p>
    </header>

    <main class="app-main">
      <ImageUploader
        v-if="step === 'upload'"
        @upload="handleUpload"
      />
      <LayoutPreview
        v-else
        :content-units="contentUnits"
        @back="handleBack"
      />
    </main>

    <footer class="app-footer">
      <p>图片不裁剪，只按比例缩放 · 文字全量显示 · 每页最多6张图片</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f5f7fa;
  color: #303133;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 32px 24px 24px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.app-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.app-header .subtitle {
  font-size: 14px;
  color: #909399;
}

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  text-align: center;
  padding: 16px;
  color: #909399;
  font-size: 12px;
  background: white;
  border-top: 1px solid #e4e7ed;
}
</style>
