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

const containerRef = ref<HTMLElement | null>(null)

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
