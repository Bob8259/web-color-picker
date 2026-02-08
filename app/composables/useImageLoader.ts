import type { Ref } from 'vue'
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'

export function useImageLoader(canvasRef: Ref<HTMLCanvasElement | null>) {
  const images = ref<string[]>([])
  const filenames = ref<string[]>([])
  const currentIndex = ref(0)
  const imageLoaded = ref(false)

  let currentImage: HTMLImageElement | null = null

  function clearCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    canvas.width = 0
    canvas.height = 0
  }

  function drawImageToCanvas() {
    const canvas = canvasRef.value
    if (!canvas || !currentImage) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    canvas.width = currentImage.naturalWidth
    canvas.height = currentImage.naturalHeight
    ctx.drawImage(currentImage, 0, 0)
    imageLoaded.value = true
  }

  function loadCurrentImage() {
    imageLoaded.value = false
    if (images.value.length === 0) return

    const img = new Image()
    img.onload = () => {
      currentImage = img
      nextTick(() => drawImageToCanvas())
    }
    img.src = images.value[currentIndex.value] ?? ''
  }

  function onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files || input.files.length === 0) return

    const newImages: string[] = []
    const newFilenames: string[] = []

    for (const file of Array.from(input.files)) {
      newImages.push(URL.createObjectURL(file))
      newFilenames.push(file.name)
    }

    const hadImages = images.value.length > 0
    images.value = images.value.concat(newImages)
    filenames.value = filenames.value.concat(newFilenames)

    if (!hadImages) {
      currentIndex.value = 0
      // Explicitly load the first image since currentIndex might already be 0
      loadCurrentImage()
    }

    // Allow re-selecting the same files in a subsequent selection
    input.value = ''
  }

  function prevImage() {
    if (currentIndex.value > 0) {
      currentIndex.value--
    }
  }

  function nextImage() {
    if (currentIndex.value < images.value.length - 1) {
      currentIndex.value++
    }
  }

  function removeCurrentImage() {
    if (images.value.length === 0) return

    const removeIndex = currentIndex.value
    const removedUrl = images.value[removeIndex]
    if (removedUrl) {
      URL.revokeObjectURL(removedUrl)
    }

    const nextImages = images.value.slice()
    const nextFilenames = filenames.value.slice()
    nextImages.splice(removeIndex, 1)
    nextFilenames.splice(removeIndex, 1)

    images.value = nextImages
    filenames.value = nextFilenames

    if (images.value.length === 0) {
      currentIndex.value = 0
      imageLoaded.value = false
      currentImage = null
      clearCanvas()
      return
    }

    currentIndex.value = Math.min(removeIndex, images.value.length - 1)
  }

  // Watch for image index changes
  watch(currentIndex, () => {
    loadCurrentImage()
  })

  // Cleanup on unmount
  onBeforeUnmount(() => {
    images.value.forEach((url) => URL.revokeObjectURL(url))
  })

  return {
    images,
    filenames,
    currentIndex,
    imageLoaded,
    drawImageToCanvas,
    loadCurrentImage,
    onFilesSelected,
    prevImage,
    nextImage,
    removeCurrentImage,
  }
}
