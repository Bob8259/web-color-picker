<template>
  <div class="p-6">
    <h2 class="text-xs font-bold mb-4 uppercase tracking-wider text-slate-500 flex items-center gap-2">
      <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
      Saved Colors
    </h2>
    <div class="grid grid-cols-2 gap-3">
      <div
        v-for="(color, index) in savedColors"
        :key="index"
        class="border p-2.5 bg-white flex items-center gap-3 relative rounded-lg transition-all duration-200 group"
        :class="color ? 'border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md' : 'border-slate-100 border-dashed bg-slate-50/50'"
      >
        <div
          v-if="color"
          class="w-8 h-8 border border-slate-200 rounded-md flex-shrink-0 shadow-sm"
          :style="{ backgroundColor: color.hex }"
        ></div>
        <div v-else class="w-8 h-8 border border-dashed border-slate-200 rounded-md flex-shrink-0 bg-slate-50"></div>
        
        <div class="min-w-0 flex-1">
          <div v-if="color" class="text-xs font-mono font-bold truncate text-slate-700">{{ color.bgrHex }}</div>
          <div v-if="color" class="text-[10px] text-black font-mono truncate">({{ color.x }}, {{ color.y }})</div>
          <div v-else class="text-xs text-slate-400 italic">Empty</div>
        </div>

        <span
          class="absolute -top-2 -left-2 w-5 h-5 text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm transition-colors"
          :class="color ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'"
        >
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
