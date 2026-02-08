import type { Ref } from 'vue'
import { ref, computed } from 'vue'
import type { ColorInfo, Region } from '~/types'

export function useScriptExport(
  region: Ref<Region | null>,
  savedColors: Ref<(ColorInfo | null)[]>
) {
  const copySuccess = ref(false)
  const copyColorsSuccess = ref(false)

  const selectedColors = computed(() => {
    return savedColors.value.filter((color): color is ColorInfo => color !== null)
  })

  // Generate the script-format text
  function generateScriptText(): string {
    if (!region.value || selectedColors.value.length === 0) return ''

    const { x1, y1, x2, y2 } = region.value
    const colors = selectedColors.value
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

  function generateColorsText(): string {
    if (selectedColors.value.length === 0) return ''

    const colors = selectedColors.value
    const first = colors[0]!
    const firstHex = first.bgrHex.replace('#', '')
    const rest = colors.slice(1).map(c => {
      const dx = c.x - first.x
      const dy = c.y - first.y
      const hex = c.bgrHex.replace('#', '')
      return `${dx}|${dy}|${hex}`
    }).join(',')

    const lines = [
      `        "${firstHex}",`,
      `        "${rest}",`,
    ]

    return lines.join(String.fromCharCode(10))
  }

  async function copyTextToClipboard(text: string, onSuccess: () => void) {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      onSuccess()
      return
    } catch {
      // Fallback for older browsers
    }

    const textarea = document.createElement('textarea')
    textarea.value = text
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    onSuccess()
  }

  function setCopySuccess(flagRef: Ref<boolean>) {
    flagRef.value = true
    setTimeout(() => {
      flagRef.value = false
    }, 2000)
  }

  // Copy to clipboard
  async function copyScriptToClipboard() {
    const text = generateScriptText()
    if (!text) return

    await copyTextToClipboard(text, () => setCopySuccess(copySuccess))
  }

  async function copyColorsToClipboard() {
    const text = generateColorsText()
    if (!text) return

    await copyTextToClipboard(text, () => setCopySuccess(copyColorsSuccess))
  }

  const canExport = computed(() => {
    return region.value !== null && selectedColors.value.length > 0
  })

  return {
    copySuccess,
    copyColorsSuccess,
    canExport,
    generateScriptText,
    generateColorsText,
    copyScriptToClipboard,
    copyColorsToClipboard,
  }
}
