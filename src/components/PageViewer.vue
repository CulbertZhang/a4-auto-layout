<script setup lang="ts">
import { computed } from 'vue'
import type { PageLayout } from '../types'
import { A4, TEXT_CONFIG } from '../utils/constants'

const props = defineProps<{
  page: PageLayout
  scale?: number
}>()

const displayScale = computed(() => props.scale || 0.2)

const containerStyle = computed(() => ({
  width: `${A4.WIDTH * displayScale.value}px`,
  height: `${A4.HEIGHT * displayScale.value}px`
}))

function scaleValue(v: number): number {
  return v * displayScale.value
}
</script>

<template>
  <div class="page-viewer" :style="containerStyle">
    <div class="page-content">
      <div
        v-for="(placement, idx) in page.placements"
        :key="idx"
        class="placement"
      >
        <!-- 图片 -->
        <img
          :src="placement.contentUnit.image.objectUrl"
          :style="{
            position: 'absolute',
            left: scaleValue(placement.imageArea.x) + 'px',
            top: scaleValue(placement.imageArea.y) + 'px',
            width: scaleValue(placement.imageArea.width) + 'px',
            height: scaleValue(placement.imageArea.height) + 'px',
            objectFit: 'contain'
          }"
        />
        <!-- 文字区域 -->
        <div
          class="text-area"
          :style="{
            position: 'absolute',
            left: scaleValue(placement.textArea.x) + 'px',
            top: scaleValue(placement.textArea.y) + 'px',
            width: scaleValue(placement.textArea.width) + 'px',
            height: scaleValue(placement.textArea.height) + 'px',
            fontSize: scaleValue(TEXT_CONFIG.TITLE_FONT_SIZE) + 'px',
            overflow: 'hidden'
          }"
        >
          <div class="title" :style="{ fontSize: scaleValue(TEXT_CONFIG.TITLE_FONT_SIZE) + 'px' }">
            {{ placement.contentUnit.text.title }}
          </div>
          <div class="description" :style="{ fontSize: scaleValue(TEXT_CONFIG.DESC_FONT_SIZE) + 'px' }">
            {{ placement.contentUnit.text.description }}
          </div>
        </div>
      </div>
    </div>
    <div class="page-number">{{ page.pageIndex + 1 }}</div>
  </div>
</template>

<style scoped>
.page-viewer {
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

.page-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.placement img {
  background: #f5f5f5;
}

.text-area {
  line-height: 1.4;
  color: #333;
}

.title {
  font-weight: bold;
  margin-bottom: 2px;
  word-break: break-all;
}

.description {
  color: #666;
  word-break: break-all;
}

.page-number {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #999;
}
</style>
