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

      <!-- Auto-picked Colors -->
      <div v-if="autoPickedColors.length > 0">
        <div class="text-xs text-gray-500 mb-1.5">Auto-picked Colors ({{ autoPickedColors.length }})</div>
        <div class="space-y-1 max-h-[200px] overflow-y-auto">
          <div
            v-for="(color, idx) in autoPickedColors"
            :key="idx"
            class="flex items-center gap-2 bg-white rounded-md p-1.5 border border-gray-100"
          >
            <div
              class="w-6 h-6 rounded border border-gray-200 flex-shrink-0"
              :style="{ backgroundColor: color.hex }"
            ></div>
            <div class="flex-1 min-w-0 font-mono text-[0.65rem]">
              <span class="font-bold text-gray-700">{{ color.hex }}</span>
              <span class="text-gray-400 ml-1">({{ color.x }}, {{ color.y }})</span>
              <span v-if="idx > 0" class="text-blue-500 ml-1">
                Δ{{ color.x - autoPickedColors[0]!.x }},{{ color.y - autoPickedColors[0]!.y }}
              </span>
            </div>
          </div>
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
  autoPickedColors: ColorInfo[]
}>()

defineEmits<{
  'update:autoPickEnabled': [value: boolean]
  'clearRegion': []
}>()
</script>
