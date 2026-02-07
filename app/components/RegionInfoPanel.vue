<template>
  <div class="px-4 py-3 border-t border-violet-100 flex-shrink-0">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
        Region Selection
      </h3>
      <!-- Auto Pick Toggle -->
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <span class="text-xs text-gray-500">Auto Pick</span>
        <div class="relative">
          <input
            type="checkbox"
            :checked="autoPickEnabled"
            @change="$emit('update:autoPickEnabled', ($event.target as HTMLInputElement).checked)"
            class="sr-only peer"
          />
          <div class="w-9 h-5 bg-gray-200 rounded-full peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500 transition-colors duration-200"></div>
          <div class="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4"></div>
        </div>
      </label>
    </div>

    <!-- Region Info -->
    <div v-if="region" class="space-y-2">
      <div class="bg-blue-50 rounded-lg p-2.5 text-xs font-mono space-y-1">
        <div class="flex justify-between text-gray-600">
          <span>From:</span>
          <span class="text-blue-600 font-bold">({{ region.x1 }}, {{ region.y1 }})</span>
        </div>
        <div class="flex justify-between text-gray-600">
          <span>To:</span>
          <span class="text-blue-600 font-bold">({{ region.x2 }}, {{ region.y2 }})</span>
        </div>
        <div class="flex justify-between text-gray-600">
          <span>Size:</span>
          <span class="text-blue-600 font-bold">{{ region.x2 - region.x1 }} × {{ region.y2 - region.y1 }}</span>
        </div>
      </div>


      <!-- Clear Region Button -->
      <button
        @click="$emit('clearRegion')"
        class="w-full py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors duration-200"
      >
        Clear Region
      </button>
    </div>

    <!-- No Region State -->
    <div v-else class="text-xs text-gray-400 italic py-2">
      Drag on the image to select a region
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorInfo, Region } from '~/types'

defineProps<{
  region: Region | null
  autoPickEnabled: boolean
}>()

defineEmits<{
  'update:autoPickEnabled': [value: boolean]
  'clearRegion': []
}>()
</script>
