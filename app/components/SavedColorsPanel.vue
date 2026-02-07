<template>
  <div class="p-4">
    <h2 class="text-sm font-bold mb-3 uppercase tracking-wider text-gray-600">Saved Colors</h2>
    <div class="grid grid-cols-2 gap-2">
      <div
        v-for="(color, index) in savedColors"
        :key="index"
        class="border p-2 bg-gray-50 flex items-center gap-2 relative"
        :class="color ? 'border-gray-400' : 'border-gray-200 border-dashed'"
      >
        <div
          v-if="color"
          class="w-6 h-6 border border-gray-300 flex-shrink-0"
          :style="{ backgroundColor: color.hex }"
        ></div>
        <div v-else class="w-6 h-6 border border-dashed border-gray-200 flex-shrink-0"></div>
        
        <div class="min-w-0">
          <div v-if="color" class="text-[10px] font-mono font-bold truncate">{{ color.hex }}</div>
          <div v-else class="text-[10px] text-gray-300 italic">Empty</div>
        </div>

        <span class="absolute -top-1.5 -left-1.5 w-4 h-4 bg-gray-800 text-white text-[8px] flex items-center justify-center rounded-full">
          {{ index === 9 ? 0 : index + 1 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorInfo } from '~/types'

defineProps<{
  savedColors: (ColorInfo | null)[]
}>()
</script>
