<template>
  <div>
    <div class="px-4 py-3 border-b border-violet-100 flex-shrink-0">
      <h2 class="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
        Saved Colors
      </h2>
      <p class="text-xs text-gray-400 mt-0.5">Press Ctrl+1~0 to save color at cursor</p>
    </div>
    <div class="p-3 grid grid-cols-2 gap-2">
      <div
        v-for="(color, index) in savedColors"
        :key="index"
        class="rounded-lg border transition-all duration-200 relative group"
        :class="color ? 'border-violet-200 bg-white shadow-sm' : 'border-dashed border-gray-200 bg-gray-50/50'"
      >
        <div v-if="color" class="p-2 flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-md border border-gray-200 shadow-inner flex-shrink-0"
            :style="{ backgroundColor: color.hex }"
          ></div>
          <div class="flex flex-col min-w-0 font-mono">
            <div class="font-bold text-[0.7rem] text-gray-800 leading-tight">{{ color.hex }}</div>
            <div class="text-[0.6rem] text-gray-400 leading-tight">({{ color.x }}, {{ color.y }})</div>
          </div>
          <span class="absolute -top-1.5 -left-1.5 w-4 h-4 bg-violet-500 text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center shadow-sm z-10">
            {{ index === 9 ? 0 : index + 1 }}
          </span>
        </div>
        <div v-else class="p-2 flex items-center gap-2 opacity-60">
          <div class="w-8 h-8 rounded-md border-2 border-dashed border-gray-200 flex-shrink-0"></div>
          <div class="text-[0.6rem] text-gray-300 italic leading-tight">Empty</div>
          <span class="absolute -top-1.5 -left-1.5 w-4 h-4 bg-gray-200 text-gray-400 text-[0.6rem] font-bold rounded-full flex items-center justify-center">
            {{ index === 9 ? 0 : index + 1 }}
          </span>
        </div>
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
