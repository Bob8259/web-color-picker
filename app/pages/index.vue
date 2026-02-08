<template>
  <div
    class="h-screen flex flex-col outline-none overflow-hidden bg-slate-50"
    @keydown="handleKeydown"
    tabindex="0"
    ref="appRef"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
      <h1 class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Color Picker</h1>
      <label class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-medium rounded-lg shadow-sm transition-all duration-200 cursor-pointer flex items-center gap-2 active:scale-95">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Select Images
        <input type="file" accept="image/*" multiple @change="onFilesSelected" class="hidden" />
      </label>
    </div>

    <!-- Main Content -->
    <div class="flex flex-1 min-h-0 w-full">
      <!-- Left Panel: Image Viewer -->
      <div class="flex-[3] flex flex-col min-h-0 min-w-0 p-6 gap-4">
        <div v-if="images.length > 0" class="flex flex-col flex-1 min-h-0 gap-4">
          <!-- Canvas Container -->
          <div class="flex-1 relative overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl shadow-inner">
            <ImageCanvas
              ref="imageCanvasRef"
              :image-loaded="imageLoaded"
              :show-crosshair="showCrosshair"
              :crosshair-style="crosshairStyle"
              :region="region"
              :preview-region="previewRegion"
              :is-selecting="isSelecting"
              :auto-picked-colors="autoPickedColors"
              :image-to-css-coords="imageToCssCoords"
              @copy-position="copyPositionToClipboard"
              @copy-color="copyColorToClipboard"
            >
              <template #canvas>
                <canvas
                  ref="canvasRef"
                  class="block bg-white cursor-none shadow-lg max-w-full max-h-full object-contain"
                  @mousedown="onCanvasMouseDown"
                  @mousemove="onCanvasMouseMove"
                  @mouseup="onCanvasMouseUp"
                  @mouseleave="onCanvasMouseLeave"
                  @mouseenter="onCanvasMouseEnter"
                  @contextmenu="onCanvasContextMenu"
                ></canvas>
              </template>
              <template #tooltip>
                <div
                  v-if="showTooltip && hoverColor"
                  class="absolute pointer-events-none z-20 bg-white/95 backdrop-blur-sm border border-slate-200 p-3 text-xs shadow-xl rounded-lg ring-1 ring-black/5"
                  :style="tooltipStyle"
                >
                  <!-- Magnifier -->
                  <div class="mb-3 border border-slate-200 rounded overflow-hidden shadow-sm">
                    <canvas
                      ref="magnifierRef"
                      :width="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      :height="MAGNIFIER_PIXELS * MAGNIFIER_SCALE"
                      class="block"
                      :style="{ width: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px`, height: `${MAGNIFIER_PIXELS * MAGNIFIER_SCALE}px` }"
                    ></canvas>
                  </div>
                  <!-- Color Info -->
                  <div class="flex items-center gap-2 mb-2">
                    <div
                      class="w-5 h-5 border border-slate-200 rounded shadow-sm"
                      :style="{ backgroundColor: hoverColor.hex }"
                    ></div>
                    <div class="font-mono font-bold text-slate-700 text-sm">{{ hoverColor.bgrHex }}</div>
                  </div>
                  <div class="font-mono text-[10px] text-slate-500 space-y-0.5">
                    <div class="flex justify-between"><span>Pos:</span> <span class="text-slate-700">{{ hoverColor.x }}, {{ hoverColor.y }}</span></div>
                    <div class="flex justify-between"><span>RGB:</span> <span class="text-slate-700">{{ hoverColor.r }}, {{ hoverColor.g }}, {{ hoverColor.b }}</span></div>
                  </div>
                </div>
              </template>
            </ImageCanvas>
          </div>

          <!-- Controls & Info -->
          <div class="flex items-center justify-between px-1">
            <div class="flex gap-2">
              <button class="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-700 rounded-lg shadow-sm transition-colors" @click="prevImage" :disabled="currentIndex === 0">Previous</button>
              <button class="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-slate-700 rounded-lg shadow-sm transition-colors" @click="nextImage" :disabled="currentIndex === images.length - 1">Next</button>
              <button class="px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 active:bg-rose-100 text-sm font-medium text-rose-600 rounded-lg shadow-sm transition-colors" @click="removeCurrentImage">Remove</button>
            </div>
            <div class="text-xs font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
              <span class="text-slate-900">{{ currentIndex + 1 }}</span> / {{ images.length }} â€?{{ filenames[currentIndex] }}
            </div>
          </div>

          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto min-h-[80px] items-center">
            <button
              v-for="(img, index) in images"
              :key="index"
              class="w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all duration-200"
              :class="index === currentIndex ? 'border-indigo-500 ring-2 ring-indigo-100 scale-105' : 'border-transparent hover:border-slate-300 opacity-70 hover:opacity-100'"
              @click="currentIndex = index"
            >
              <img :src="img" class="w-full h-full object-cover" />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm border-dashed border-2">
          <div class="text-center space-y-3">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-slate-500 font-medium">No images selected</p>
            <p class="text-xs text-slate-400">Click "Select Images" to get started</p>
          </div>
        </div>
      </div>

      <!-- Right Panel -->
      <ClientOnly>
        <div class="w-80 bg-white border-l border-slate-200 flex flex-col min-h-0 shadow-lg z-10">
          <div class="flex-1 overflow-y-auto">
            <SavedColorsPanel :saved-colors="savedColors" />
            <RegionInfoPanel
              v-model:region="region"
              v-model:auto-pick-enabled="autoPickEnabled"
              @clear-region="clearRegion"
              @re-auto-select="autoPickColors"
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
const imageCanvasRef = ref<any>(null)
const rightClickPos = ref({ x: 0, y: 0 })

  const {
    images,
    filenames,
    currentIndex,
    imageLoaded,
    onFilesSelected,
    prevImage,
    nextImage,
    loadCurrentImage,
    removeCurrentImage
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
  autoPickColors,
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
    left: `${css.x + 2 - 12}px`,
    top: `${css.y + 2 - 12}px`
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

function onCanvasContextMenu(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top

  const { x, y } = cssToImageCoords(offsetX, offsetY)
  rightClickPos.value = { x, y }
  imageCanvasRef.value?.handleContextMenu(event)
}

async function copyTextToClipboard(text: string) {
  if (!text) return

  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement("textarea")
  textArea.value = text
  textArea.style.position = "fixed"
  textArea.style.left = "-9999px"
  textArea.style.top = "-9999px"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  document.execCommand('copy')
  textArea.remove()
}

async function copyPositionToClipboard() {
  const pos = `${rightClickPos.value.x}, ${rightClickPos.value.y}`

  try {
    await copyTextToClipboard(pos)
  } catch (err) {
    console.error('Failed to copy position: ', err)
  }
}

async function copyColorToClipboard() {
  const color = getPixelColor(rightClickPos.value.x, rightClickPos.value.y)
  const hex = color?.bgrHex ?? ''

  try {
    await copyTextToClipboard(hex)
  } catch (err) {
    console.error('Failed to copy color: ', err)
  }
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
