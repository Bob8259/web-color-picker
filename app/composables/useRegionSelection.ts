import type { Ref } from 'vue'
import { ref, computed } from 'vue'
import type { ColorInfo, Region } from '~/types'

export function useRegionSelection(
  canvasRef: Ref<HTMLCanvasElement | null>,
  getPixelColor: (x: number, y: number) => ColorInfo | null
) {
  const region = ref<Region | null>(null)
  const isSelecting = ref(false)
  const selectionStart = ref({ x: 0, y: 0 })
  const selectionCurrent = ref({ x: 0, y: 0 })
  const autoPickEnabled = ref(true)
  const autoPickedColors = ref<ColorInfo[]>([])

  // Start region selection (image coordinates)
  function startSelection(imgX: number, imgY: number) {
    isSelecting.value = true
    selectionStart.value = { x: imgX, y: imgY }
    selectionCurrent.value = { x: imgX, y: imgY }
    region.value = null
    autoPickedColors.value = []
  }

  // Update selection during drag (image coordinates)
  function updateSelection(imgX: number, imgY: number) {
    if (!isSelecting.value) return
    selectionCurrent.value = { x: imgX, y: imgY }
  }

  // Finalize selection
  function endSelection(imgX: number, imgY: number) {
    if (!isSelecting.value) return
    isSelecting.value = false

    const x1 = Math.min(selectionStart.value.x, imgX)
    const y1 = Math.min(selectionStart.value.y, imgY)
    const x2 = Math.max(selectionStart.value.x, imgX)
    const y2 = Math.max(selectionStart.value.y, imgY)

    // Only create region if it's large enough (> 3px in both dimensions)
    if (x2 - x1 > 3 && y2 - y1 > 3) {
      region.value = { x1, y1, x2, y2 }
      if (autoPickEnabled.value) {
        autoPickColors()
      }
    } else {
      region.value = null
      autoPickedColors.value = []
    }
  }

  // Preview region during drag (normalized coordinates)
  const previewRegion = computed<Region | null>(() => {
    if (!isSelecting.value) return null
    return {
      x1: Math.min(selectionStart.value.x, selectionCurrent.value.x),
      y1: Math.min(selectionStart.value.y, selectionCurrent.value.y),
      x2: Math.max(selectionStart.value.x, selectionCurrent.value.x),
      y2: Math.max(selectionStart.value.y, selectionCurrent.value.y),
    }
  })

  // Auto-pick 10 evenly distributed colors in the region
  function autoPickColors() {
    if (!region.value) return
    const { x1, y1, x2, y2 } = region.value
    const w = x2 - x1
    const h = y2 - y1

    // Use 5 columns × 2 rows = 10 points
    const cols = 5
    const rows = 2
    const colors: ColorInfo[] = []

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = Math.round(x1 + (col + 0.5) * w / cols)
        const py = Math.round(y1 + (row + 0.5) * h / rows)
        const color = getPixelColor(px, py)
        if (color) {
          colors.push(color)
        }
      }
    }

    autoPickedColors.value = colors
  }

  // Clear region and auto-picked colors
  function clearRegion() {
    region.value = null
    isSelecting.value = false
    autoPickedColors.value = []
  }

  return {
    region,
    isSelecting,
    selectionStart,
    selectionCurrent,
    previewRegion,
    autoPickEnabled,
    autoPickedColors,
    startSelection,
    updateSelection,
    endSelection,
    autoPickColors,
    clearRegion,
  }
}
