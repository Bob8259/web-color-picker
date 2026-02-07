<template>
  <div
    class="h-screen flex flex-col outline-none overflow-hidden bg-gray-100"
    @keydown="handleKeydown"
    tabindex="0"
    ref="appRef"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
      <h1 class="text-lg font-bold">Color Picker</h1>
      <label class="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-50 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer">
        Select Images
        <input type="file" accept="image/*" multiple @change="onFilesSelected" class="hidden" />
      </label>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 min-h-0 w-full">
      <!-- Left Panel: Image Viewer -->
      <div class="flex-[3] flex flex-col min-h-0 min-w-0 p-4">
        <div v-if="images.length > 0" class="flex flex-col flex-1 min-h-0">
          <!-- Canvas Container -->
          <div class="flex-1 relative overflow-auto flex items-center justify-center bg-gray-200 border border-gray-300">
            <ImageCanvas
              :image-loaded="imageLoaded"
              :show-crosshair="showCrosshair"
              :crosshair-style="crosshairStyle"
              :region="region"
              :preview-region="previewRegion"
              :is-selecting="isSelecting"
              :auto-picked-colors="autoPickedColors"
              :image-to-css-coords="imageToCssCoords"
            >
              <template #canvas>
                <canvas
                  ref="canvasRef"
                  class="block bg-white cursor-none"
                  @mousedown="onCanvasMouseDown"
                  @mousemove="onCanvasMouseMove"
                  @mouseup="onCanvasMouseUp"
                  @mouseleave="onCanvasMouseLeave"
                  @mouseenter="onCanvasMouseEnter"
                ></canvas>
              </template>
              <template #tooltip>
                <div
                  v-if="showTooltip && hoverColor"
                  class="absolute pointer-events-none z-20 bg-white border border-gray-400 p-2 text-xs shadow-md"
                  :style="tooltipStyle"
                >
                  <!-- Magnifier -->
                  <div class="mb-2 border border-gray-300">
                    <canvas
                      ref="magnifierRef"
                      :width="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      :height="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      class="block"
                      :style="{ width: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px`, height: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px` }"
                    ></canvas>
                  </div>
                  <!-- Color Info -->
                  <div class="flex items-center gap-2 mb-1">
                    <div
                      class="w-4 h-4 border border-gray-400"
                      :style="{ backgroundColor: hoverColor.hex }"
                    ></div>
                    <div class="font-mono font-bold">{{ hoverColor.hex }}</div>
                  </div>
                  <div class="font-mono text-[10px] text-gray-600">
                    <div>Pos: {{ hoverColor.x }}, {{ hoverColor.y }}</div>
                    <div>RGB: {{ hoverColor.r }},{{ hoverColor.g }},{{ hoverColor.b }}</div>
                  </div>
                </div>
              </template>
            </ImageCanvas>
          </div>

          <!-- Controls & Info -->
          <div class="flex items-center justify-between mt-2 px-1">
            <div class="flex gap-2">
              <button class="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-50 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm" @click="prevImage" :disabled="currentIndex === 0">Previous</button>
              <button class="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-50 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm" @click="nextImage" :disabled="currentIndex === images.length - 1">Next</button>
            </div>
            <div class="text-xs text-gray-600">
              {{ currentIndex + 1 }} / {{ images.length }} - {{ filenames[currentIndex] }}
            </div>
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="flex gap-2 mt-2 p-2 bg-white border border-gray-300 overflow-x-auto">
            <button
              v-for="(img, index) in images"
              :key="index"
              class="w-12 h-12 border-2 flex-shrink-0"
              :class="index === currentIndex ? 'border-black' : 'border-transparent'"
              @click="currentIndex = index"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center bg-white border border-gray-300">
          <p class="text-gray-500">No images selected</p>
        </div>
      </div>

      <!-- Right Panel -->
      <ClientOnly>
        <div class="w-80 bg-white border-l border-gray-300 flex flex-col min-h-0">
          <div class="flex-1 overflow-y-auto">
            <SavedColorsPanel :saved-colors="savedColors" />
            <RegionInfoPanel
              :region="region"
              v-model:auto-pick-enabled="autoPickEnabled"
              @clear-region="clearRegion"
            />
          </div>
          <div class="p-4 border-t border-gray-200 space-y-4">
            <ScriptExportButton
              :can-export="canExport"
              :copy-success="copySuccess"
              @copy="copyScriptToClipboard"
            />
            <KeyboardHints />
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useImageLoader } from '~/composables/useImageLoader'
import { useColorPicker } from '~/composables/useColorPicker'
import { useMagnifier, MAGNIFIER_PIXELS, MAGNIFIER_SCALE } from '~/composables/useMagnifier'
import { useRegionSelection } from '~/composables/useRegionSelection'
import { useScriptExport } from '~/composables/useScriptExport'

const appRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const magnifierRef = ref<HTMLCanvasElement | null>(null)

const {
  images,
  filenames,
  currentIndex,
  imageLoaded,
  onFilesSelected,
  prevImage,
  nextImage,
  loadCurrentImage
} = useImageLoader(canvasRef)

const {
  savedColors,
  hoverColor,
  showTooltip,
  showCrosshair,
  cursorPos,
  mouseCanvasPos,
  getPixelColor,
  cssToImageCoords,
  imageToCssCoords,
  saveColorToSlot,
  saveSpecificColorToSlot,
  resetCursorToCenter
} = useColorPicker(canvasRef, imageLoaded)

const { drawMagnifier } = useMagnifier(canvasRef, magnifierRef, cursorPos)

const {
  region,
  isSelecting,
  previewRegion,
  autoPickEnabled,
  autoPickedColors,
  startSelection,
  updateSelection,
  endSelection,
  clearRegion
} = useRegionSelection(canvasRef, getPixelColor)

const {
  copySuccess,
  canExport,
  copyScriptToClipboard
} = useScriptExport(region, autoPickedColors)

const crosshairStyle = computed(() => {
  const css = imageToCssCoords(cursorPos.value.x, cursorPos.value.y)
  return {
    left: `${css.x - 12}px`,
    top: `${css.y - 12}px`
  }
})

const tooltipWidth = 140
const tooltipHeight = 160

const tooltipStyle = computed(() => {
  const canvas = canvasRef.value
  if (!canvas) return {}

  const cssPos = imageToCssCoords(cursorPos.value.x, cursorPos.value.y)
  const canvasWidth = canvas.clientWidth
  const canvasHeight = canvas.clientHeight

  let left = cssPos.x + 20
  let top = cssPos.y + 20

  if (left + tooltipWidth > canvasWidth) {
    left = cssPos.x - tooltipWidth - 20
  }
  if (top + tooltipHeight > canvasHeight) {
    top = cssPos.y - tooltipHeight - 20
  }

  return { left: `${left}px`, top: `${top}px` }
})

function onCanvasMouseDown(event: MouseEvent) {
  const { x, y } = cssToImageCoords(event.offsetX, event.offsetY)
  startSelection(x, y)
}

function onCanvasMouseMove(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas || !imageLoaded.value) return

  const { x, y } = cssToImageCoords(event.offsetX, event.offsetY)
  mouseCanvasPos.value = { x: event.offsetX, y: event.offsetY }
  cursorPos.value = { x, y }
  hoverColor.value = getPixelColor(x, y)
  showTooltip.value = true
  showCrosshair.value = true

  if (isSelecting.value) {
    updateSelection(x, y)
  }

  nextTick(() => drawMagnifier())
}

function onCanvasMouseUp(event: MouseEvent) {
  const { x, y } = cssToImageCoords(event.offsetX, event.offsetY)
  endSelection(x, y)
}

function onCanvasMouseLeave() {
  showTooltip.value = false
}

function onCanvasMouseEnter() {
  showTooltip.value = true
}

function handleKeydown(event: KeyboardEvent) {
  const canvas = canvasRef.value

  if (event.key === 'PageUp') {
    event.preventDefault()
    prevImage()
    return
  }
  if (event.key === 'PageDown') {
    event.preventDefault()
    nextImage()
    return
  }

  if (!canvas || !imageLoaded.value) return

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    cursorPos.value = { x: cursorPos.value.x, y: Math.max(0, cursorPos.value.y - 1) }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    cursorPos.value = { x: cursorPos.value.x, y: Math.min(canvas.height - 1, cursorPos.value.y + 1) }
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    cursorPos.value = { x: Math.max(0, cursorPos.value.x - 1), y: cursorPos.value.y }
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    cursorPos.value = { x: Math.min(canvas.width - 1, cursorPos.value.x + 1), y: cursorPos.value.y }
  }

  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    hoverColor.value = getPixelColor(cursorPos.value.x, cursorPos.value.y)
    showCrosshair.value = true
    showTooltip.value = true
    nextTick(() => drawMagnifier())
  }

  if (event.ctrlKey && !event.altKey && !event.shiftKey) {
    const keyNum = parseInt(event.key)
    if (!isNaN(keyNum) && keyNum >= 0 && keyNum <= 9) {
      event.preventDefault()
      const slotIndex = keyNum === 0 ? 9 : keyNum - 1
      saveColorToSlot(slotIndex)
    }
  }
}

onMounted(() => {
  appRef.value?.focus()
  if (images.value.length > 0) {
    loadCurrentImage()
  }
})

watch(imageLoaded, (loaded) => {
  if (loaded) {
    resetCursorToCenter()
    nextTick(() => drawMagnifier())
  }
})

watch(autoPickedColors, (newColors) => {
  if (newColors.length > 0) {
    newColors.forEach((color, index) => {
      if (index < 10) {
        saveSpecificColorToSlot(color, index)
      }
    })
  }
})
</script>
