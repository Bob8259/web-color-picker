import type { Ref } from 'vue'
import { ref } from 'vue'
import type { ColorInfo } from '~/types'

export function useColorPicker(
  canvasRef: Ref<HTMLCanvasElement | null>,
  imageLoaded: Ref<boolean>
) {
  // Color picking state
  const savedColors = ref<(ColorInfo | null)[]>(Array.from({ length: 10 }, () => null))
  const hoverColor = ref<ColorInfo | null>(null)
  const showTooltip = ref(false)
  const showCrosshair = ref(false)
  const cursorPos = ref({ x: 0, y: 0 })
  const mouseCanvasPos = ref({ x: 0, y: 0 })

  // Utility: RGB to hex string
  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase()
  }

  // Read pixel color at image coordinates
  function getPixelColor(imgX: number, imgY: number): ColorInfo | null {
    const canvas = canvasRef.value
    if (!canvas) return null
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return null

    const x = Math.max(0, Math.min(imgX, canvas.width - 1))
    const y = Math.max(0, Math.min(imgY, canvas.height - 1))

    const pixel = ctx.getImageData(x, y, 1, 1).data
    const r = pixel[0] ?? 0
    const g = pixel[1] ?? 0
    const b = pixel[2] ?? 0
    return { x, y, r, g, b, hex: rgbToHex(r, g, b) }
  }

  // Convert mouse offset (CSS pixels) to image pixel coordinates
  function cssToImageCoords(offsetX: number, offsetY: number): { x: number; y: number } {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const scaleX = canvas.width / canvas.clientWidth
    const scaleY = canvas.height / canvas.clientHeight
    return {
      x: Math.floor(offsetX * scaleX),
      y: Math.floor(offsetY * scaleY),
    }
  }

  // Convert image pixel coordinates to CSS position (for overlays)
  function imageToCssCoords(imgX: number, imgY: number): { x: number; y: number } {
    const canvas = canvasRef.value
    if (!canvas) return { x: 0, y: 0 }
    const scaleX = canvas.clientWidth / canvas.width
    const scaleY = canvas.clientHeight / canvas.height
    return {
      x: imgX * scaleX,
      y: imgY * scaleY,
    }
  }

  // Save color to a slot (0-9)
  function saveColorToSlot(slotIndex: number) {
    const color = getPixelColor(cursorPos.value.x, cursorPos.value.y)
    if (color) {
      savedColors.value[slotIndex] = color
      savedColors.value = [...savedColors.value]
    }
  }

  // Reset cursor to canvas center
  function resetCursorToCenter() {
    const canvas = canvasRef.value
    if (!canvas) return
    cursorPos.value = {
      x: Math.floor(canvas.width / 2),
      y: Math.floor(canvas.height / 2),
    }
    showCrosshair.value = true
  }

  return {
    savedColors,
    hoverColor,
    showTooltip,
    showCrosshair,
    cursorPos,
    mouseCanvasPos,
    rgbToHex,
    getPixelColor,
    cssToImageCoords,
    imageToCssCoords,
    saveColorToSlot,
    resetCursorToCenter,
    saveSpecificColorToSlot: (color: ColorInfo, slotIndex: number) => {
      savedColors.value[slotIndex] = { ...color }
      savedColors.value = [...savedColors.value]
    }
  }
}
