import type { Ref } from 'vue'
import { ref, computed } from 'vue'
import type { ColorInfo, Region } from '~/types'

export function useScriptExport(
  region: Ref<Region | null>,
  autoPickedColors: Ref<ColorInfo[]>
) {
  const copySuccess = ref(false)

  // Generate the script-format text
  function generateScriptText(): string {
    if (!region.value || autoPickedColors.value.length === 0) return ''

    const { x1, y1, x2, y2 } = region.value
    const colors = autoPickedColors.value
    const first = colors[0]!

    // First color hex (without #)
    const firstHex = first.bgrHex.replace('#', '')

    // Remaining colors as "dx|dy|HEX" relative to first point
    const rest = colors.slice(1).map(c => {
      const dx = c.x - first.x
      const dy = c.y - first.y
      const hex = c.bgrHex.replace('#', '')
      return `${dx}|${dy}|${hex}`
    }).join(',')

    const lines = [
      `        ${x1},`,
      `        ${y1},`,
      `        ${x2},`,
      `        ${y2},`,
      `        "${firstHex}",`,
      `        "${rest}",`,
      `        0,`,
      `        0.9,`,
    ]

    return lines.join(String.fromCharCode(10))
  }

  // Copy to clipboard
  async function copyScriptToClipboard() {
    const text = generateScriptText()
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
    }
  }

  const canExport = computed(() => {
    return region.value !== null && autoPickedColors.value.length > 0
  })

  return {
    copySuccess,
    canExport,
    generateScriptText,
    copyScriptToClipboard,
  }
}
