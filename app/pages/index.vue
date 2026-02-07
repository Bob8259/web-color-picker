<template>
  <div
    class="h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 text-gray-800 font-sans flex flex-col outline-none overflow-hidden"
    @keydown="handleKeydown"
    tabindex="0"
    ref="appRef"
  >
    <!-- Header -->
    <div class="flex items-center gap-6 w-full px-6 py-3 flex-shrink-0">
      <h1 class="flex-1 text-2xl font-bold m-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 bg-clip-text text-transparent">
        Color Picker
      </h1>
      <label class="px-5 py-2.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 text-white rounded-xl cursor-pointer text-[0.9rem] shadow-lg shadow-violet-200 transition-all duration-300 hover:from-violet-600 hover:via-fuchsia-600 hover:to-indigo-600 hover:shadow-xl hover:shadow-violet-300 hover:scale-105">
        Select Images
        <input type="file" accept="image/*" multiple @change="onFilesSelected" class="hidden" />
      </label>
    </div>

    <!-- Gradient Divider -->
    <div class="w-full h-[2px] bg-gradient-to-r from-transparent via-violet-400 to-transparent flex-shrink-0"></div>

    <!-- Main Content: Left (Image) + Right (Colors) -->
    <div class="flex flex-1 min-h-0 w-full">

      <!-- Left Panel: Image Viewer -->
      <div class="flex-[2] flex flex-col min-h-0 min-w-0 p-4">
        <div v-if="images.length > 0" class="flex flex-col flex-1 min-h-0">
          <!-- Image Navigation Row -->
          <div class="flex items-center gap-3 flex-1 min-h-0">
            <button
              class="bg-white border border-gray-200 text-violet-500 text-2xl w-10 h-10 rounded-full cursor-pointer flex items-center justify-center flex-shrink-0 transition-all duration-300 leading-none shadow-sm hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-violet-500 hover:not-disabled:to-indigo-500 hover:not-disabled:text-white hover:not-disabled:border-transparent hover:not-disabled:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              @click="prevImage"
              :disabled="currentIndex === 0"
              aria-label="Previous image"
            >‹</button>

            <!-- Canvas Container -->
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
                  class="block max-w-full max-h-[calc(100vh-220px)] bg-white cursor-none"
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
                  class="absolute pointer-events-none z-20 bg-gray-900/90 backdrop-blur-sm text-white rounded-xl px-4 py-3 text-sm shadow-xl border border-white/10"
                  :style="tooltipStyle"
                >
                  <!-- Magnifier Canvas -->
                  <div class="mb-2 rounded-lg overflow-hidden border border-white/20">
                    <canvas
                      ref="magnifierRef"
                      :width="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      :height="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      class="block"
                      :style="{ width: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px`, height: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px` }"
                    ></canvas>
                  </div>
                  <!-- Color Info -->
                  <div class="flex items-center gap-3 mb-2">
                    <div
                      class="w-8 h-8 rounded-md border-2 border-white/30 shadow-inner flex-shrink-0"
                      :style="{ backgroundColor: hoverColor.hex }"
                    ></div>
                    <div class="font-mono font-bold text-base">{{ hoverColor.hex }}</div>
                  </div>
                  <div class="flex flex-col gap-1 text-xs font-mono text-gray-300">
                    <div>Position: ({{ hoverColor.x }}, {{ hoverColor.y }})</div>
                    <div>RGB: ({{ hoverColor.r }}, {{ hoverColor.g }}, {{ hoverColor.b }})</div>
                  </div>
                </div>
              </template>
            </ImageCanvas>

            <button
              class="bg-white border border-gray-200 text-violet-500 text-2xl w-10 h-10 rounded-full cursor-pointer flex items-center justify-center flex-shrink-0 transition-all duration-300 leading-none shadow-sm hover:not-disabled:bg-gradient-to-br hover:not-disabled:from-violet-500 hover:not-disabled:to-indigo-500 hover:not-disabled:text-white hover:not-disabled:border-transparent hover:not-disabled:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
              @click="nextImage"
              :disabled="currentIndex === images.length - 1"
              aria-label="Next image"
            >›</button>
          </div>

          <!-- Image Info -->
          <div class="text-center mt-2 flex-shrink-0">
            <div class="text-sm text-gray-500">{{ currentIndex + 1 }} / {{ images.length }}</div>
            <div class="text-xs text-gray-400 mt-0.5 max-w-[300px] mx-auto overflow-hidden text-ellipsis whitespace-nowrap">{{ filenames[currentIndex] }}</div>
          </div>

          <!-- Thumbnail Strip -->
          <div v-if="images.length > 1" class="flex gap-2 mt-3 p-2 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 rounded-xl border border-violet-100 overflow-x-auto shadow-sm flex-shrink-0">
            <button
              v-for="(img, index) in images"
              :key="index"
              class="w-12 h-12 rounded-md overflow-hidden border-2 cursor-pointer p-0 bg-none flex-shrink-0 transition-colors duration-200"
              :class="index === currentIndex ? 'border-violet-500' : 'border-transparent hover:border-gray-300'"
              @click="currentIndex = index"
            >
              <img :src="img" :alt="`Thumbnail ${index + 1}`" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center">
          <div class="text-[4rem] mb-4">🖼️</div>
          <p class="my-1 text-lg font-medium bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">No images selected</p>
          <p class="text-[0.85rem] text-gray-400 my-1">Click "Select Images" to upload multiple images</p>
        </div>
      </div>

      <!-- Right Panel: Saved Colors & Region Info -->
      <ClientOnly>
        <div class="flex-[1] border-l border-violet-100 bg-gradient-to-b from-violet-50/50 to-white flex flex-col min-h-0 max-w-[380px]">
          <div class="flex-1 overflow-y-auto">
            <SavedColorsPanel :saved-colors="savedColors" />
            <RegionInfoPanel
              :region="region"
              v-model:auto-pick-enabled="autoPickEnabled"
              :auto-picked-colors="autoPickedColors"
              @clear-region="clearRegion"
              @save-color="saveSpecificColorToSlot"
            />
          </div>

          <ScriptExportButton
            :can-export="canExport"
            :copy-success="copySuccess"
            @copy="copyScriptToClipboard"
          />

          <KeyboardHints />
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

// Refs for DOM elements
const appRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const magnifierRef = ref<HTMLCanvasElement | null>(null)

// Composables
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

// Computed styles for crosshair overlay
const crosshairStyle = computed(() => {
  const css = imageToCssCoords(cursorPos.value.x, cursorPos.value.y)
  // +2px offset for the gradient border padding
  return {
    left: `${css.x + 2 - 12}px`,
    top: `${css.y + 2 - 12}px`
  }
})

// Computed styles for tooltip positioning
const tooltipWidth = MAGNIFIER_PIXELS * MAGNIFIER_SCALE + 32
const tooltipHeight = MAGNIFIER_PIXELS * MAGNIFIER_SCALE + 110

const tooltipStyle = computed(() => {
  const canvas = canvasRef.value
  if (!canvas) return {}

  const cssPos = imageToCssCoords(cursorPos.value.x, cursorPos.value.y)
  const canvasWidth = canvas.clientWidth
  const canvasHeight = canvas.clientHeight

  let left = cssPos.x + 2 + 20
  let top = cssPos.y + 2 + 20

  if (left + tooltipWidth > canvasWidth + 4) {
    left = cssPos.x + 2 - tooltipWidth - 20
  }
  if (top + tooltipHeight > canvasHeight + 4) {
    top = cssPos.y + 2 - tooltipHeight - 20
  }

  return { left: `${left}px`, top: `${top}px` }
})

// Canvas mouse event handlers
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

// Keyboard handler
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

// Lifecycle hooks
onMounted(() => {
  appRef.value?.focus()
  if (images.value.length > 0) {
    loadCurrentImage()
  }
})

// Watch for image changes to reset cursor
watch(imageLoaded, (loaded) => {
  if (loaded) {
    resetCursorToCenter()
    nextTick(() => drawMagnifier())
  }
})
</script>
