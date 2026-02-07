import type { Ref } from 'vue'

export const MAGNIFIER_PIXELS = 25  // 25x25 pixel region
export const MAGNIFIER_SCALE = 6    // each pixel drawn as 6x6

export function useMagnifier(
  canvasRef: Ref<HTMLCanvasElement | null>,
  magnifierRef: Ref<HTMLCanvasElement | null>,
  cursorPos: Ref<{ x: number; y: number }>
) {
  function drawMagnifier() {
    const magCanvas = magnifierRef.value
    const srcCanvas = canvasRef.value
    if (!magCanvas || !srcCanvas) return
    const magCtx = magCanvas.getContext('2d')
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })
    if (!magCtx || !srcCtx) return

    const size = MAGNIFIER_PIXELS
    const scale = MAGNIFIER_SCALE
    const half = Math.floor(size / 2)
    const cx = cursorPos.value.x
    const cy = cursorPos.value.y

    // Calculate the source region to read (clamped to canvas bounds)
    const srcX = Math.max(0, cx - half)
    const srcY = Math.max(0, cy - half)
    const srcEndX = Math.min(srcCanvas.width, cx - half + size)
    const srcEndY = Math.min(srcCanvas.height, cy - half + size)
    const srcW = srcEndX - srcX
    const srcH = srcEndY - srcY

    // Batch-read the entire region at once
    const imageData = srcW > 0 && srcH > 0
      ? srcCtx.getImageData(srcX, srcY, srcW, srcH)
      : null

    // Clear magnifier
    magCtx.clearRect(0, 0, size * scale, size * scale)

    // Draw each pixel scaled up
    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const sx = cx - half + dx
        const sy = cy - half + dy
        const clampedX = Math.max(0, Math.min(sx, srcCanvas.width - 1))
        const clampedY = Math.max(0, Math.min(sy, srcCanvas.height - 1))

        let r = 0, g = 0, b = 0
        if (imageData) {
          const localX = clampedX - srcX
          const localY = clampedY - srcY
          const idx = (localY * srcW + localX) * 4
          r = imageData.data[idx] ?? 0
          g = imageData.data[idx + 1] ?? 0
          b = imageData.data[idx + 2] ?? 0
        }

        magCtx.fillStyle = `rgb(${r}, ${g}, ${b})`
        magCtx.fillRect(dx * scale, dy * scale, scale, scale)
      }
    }

    // Draw grid lines
    magCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    magCtx.lineWidth = 0.5
    for (let i = 1; i < size; i++) {
      magCtx.beginPath()
      magCtx.moveTo(i * scale, 0)
      magCtx.lineTo(i * scale, size * scale)
      magCtx.stroke()
      magCtx.beginPath()
      magCtx.moveTo(0, i * scale)
      magCtx.lineTo(size * scale, i * scale)
      magCtx.stroke()
    }

    // Highlight center pixel
    magCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
    magCtx.lineWidth = 2
    magCtx.strokeRect(half * scale + 1, half * scale + 1, scale - 2, scale - 2)
    magCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
    magCtx.lineWidth = 1
    magCtx.strokeRect(half * scale, half * scale, scale, scale)
  }

  return {
    drawMagnifier,
  }
}
