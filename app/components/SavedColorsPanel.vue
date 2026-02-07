<template>
  <div>
    <div class="px-4 py-3 border-b border-violet-100 flex-shrink-0">
      <h2 class="text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
        Saved Colors
      </h2>
      <p class="text-xs text-gray-400 mt-0.5">Press Ctrl+1~0 to save color at cursor</p>
    </div>
    <div class="overflow-y-auto p-3 space-y-2">
      <div
        v-for="(color, index) in savedColors"
        :key="index"
        class="rounded-lg border transition-all duration-200"
        :class="color ? 'border-violet-200 bg-white shadow-sm' : 'border-dashed border-gray-200 bg-gray-50/50'"
      >
        <div v-if="color" class="p-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 flex-shrink-0">
              <span class="text-xs font-bold text-violet-500 w-5">{{ index + 1 }}</span>
              <div
                class="w-10 h-10 rounded-lg border border-gray-200 shadow-inner flex-shrink-0"
                :style="{ backgroundColor: color.hex }"
              ></div>
            </div>
            <div class="flex flex-col gap-0.5 min-w-0 font-mono text-xs">
              <div class="font-bold text-sm text-gray-800">{{ color.hex }}</div>
              <div class="text-gray-500">RGB({{ color.r }}, {{ color.g }}, {{ color.b }})</div>
              <div class="text-gray-400">Position: ({{ color.x }}, {{ color.y }})</div>
            </div>
          </div>
        </div>
        <div v-else class="p-3 flex items-center gap-3">
          <span class="text-xs font-bold text-gray-300 w-5">{{ index + 1 }}</span>
          <div class="w-10 h-10 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"></div>
          <span class="text-xs text-gray-300 italic">Empty — Ctrl+{{ index === 9 ? '0' : index + 1 }}</span>
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
