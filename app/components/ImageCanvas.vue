<template>
  <div class="flex-1 flex items-center justify-center min-h-0 min-w-0 relative">
    <div class="relative inline-block max-w-full max-h-full" ref="containerRef">
      <div class="p-[2px] bg-gradient-to-br from-violet-400 via-fuchsia-300 to-indigo-400 shadow-lg shadow-violet-100">
        <!-- Canvas slot — rendered by parent so refs stay in parent scope -->
        <slot name="canvas" />
      </div>

      <!-- Crosshair Marker -->
      <div
        v-if="showCrosshair && imageLoaded"
        class="absolute pointer-events-none z-10"
        :style="crosshairStyle"
      >
        <div class="w-6 h-6 relative">
          <div class="absolute top-1/2 left-0 w-full h-[1px] bg-rose-500 shadow-sm -translate-y-1/2"></div>
          <div class="absolute left-1/2 top-0 h-full w-[1px] bg-rose-500 shadow-sm -translate-x-1/2"></div>
          <div class="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full border border-rose-500 bg-transparent shadow-sm -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <!-- Region Selection Preview (while dragging) -->
      <div
        v-if="previewRegionStyle"
        class="absolute pointer-events-none z-10 border-2 border-dashed border-indigo-400 bg-indigo-400/10"
        :style="previewRegionStyle"
      ></div>

      <!-- Finalized Region Overlay -->
      <div
        v-if="regionStyle && !isSelecting"
        class="absolute pointer-events-none z-10 border-2 border-indigo-500 bg-indigo-500/10"
        :style="regionStyle"
      >
        <!-- Auto-picked color dots -->
        <div
          v-for="(dot, idx) in autoPickDots"
          :key="idx"
          class="absolute w-2.5 h-2.5 rounded-full border border-white shadow-sm pointer-events-none"
          :style="dot.style"
        ></div>
      </div>

      <!-- Tooltip slot — rendered by parent so magnifier ref stays in parent scope -->
      <slot name="tooltip" />

      <!-- Context Menu -->
      <div
        v-if="contextMenu.show"
        class="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl py-1 min-w-[120px]"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }"
        @click.stop
      >
        <button
          class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors flex items-center gap-2"
          @click="onCopyPosition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          Copy Position
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorInfo, Region } from '~/types'

const props = defineProps<{
  imageLoaded: boolean
  showCrosshair: boolean
  crosshairStyle: Record<string, string>
  region: Region | null
  previewRegion: Region | null
  isSelecting: boolean
  autoPickedColors: ColorInfo[]
  imageToCssCoords: (imgX: number, imgY: number) => { x: number; y: number }
}>()

const emit = defineEmits<{
  (e: 'copy-position'): void
}>()

const containerRef = ref<HTMLElement | null>(null)

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0
})

const closeContextMenu = () => {
  contextMenu.show = false
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  contextMenu.show = true
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
}

const onCopyPosition = () => {
  emit('copy-position')
  closeContextMenu()
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu)
  window.addEventListener('contextmenu', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('contextmenu', closeContextMenu)
})

defineExpose({
  handleContextMenu
})

// Region preview style (while dragging)
const previewRegionStyle = computed(() => {
  if (!props.previewRegion) return null
  const tl = props.imageToCssCoords(props.previewRegion.x1, props.previewRegion.y1)
  const br = props.imageToCssCoords(props.previewRegion.x2, props.previewRegion.y2)
  return {
    left: `${tl.x + 2}px`,
    top: `${tl.y + 2}px`,
    width: `${br.x - tl.x}px`,
    height: `${br.y - tl.y}px`,
  }
})

// Finalized region overlay style
const regionStyle = computed(() => {
  if (!props.region) return null
  const tl = props.imageToCssCoords(props.region.x1, props.region.y1)
  const br = props.imageToCssCoords(props.region.x2, props.region.y2)
  return {
    left: `${tl.x + 2}px`,
    top: `${tl.y + 2}px`,
    width: `${br.x - tl.x}px`,
    height: `${br.y - tl.y}px`,
  }
})

// Auto-pick dot positions (relative to region overlay)
const autoPickDots = computed(() => {
  if (!props.region || props.autoPickedColors.length === 0) return []
  const r = props.region
  const tl = props.imageToCssCoords(r.x1, r.y1)
  const br = props.imageToCssCoords(r.x2, r.y2)
  const regionCssW = br.x - tl.x
  const regionCssH = br.y - tl.y
  const regionImgW = r.x2 - r.x1
  const regionImgH = r.y2 - r.y1

  return props.autoPickedColors.map(color => {
    const relX = ((color.x - r.x1) / regionImgW) * regionCssW
    const relY = ((color.y - r.y1) / regionImgH) * regionCssH
    return {
      style: {
        left: `${relX - 5}px`,
        top: `${relY - 5}px`,
        backgroundColor: color.hex,
      },
    }
  })
})
</script>
