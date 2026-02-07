<template>
  <div class="p-6 border-t border-slate-100">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
        <span class="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
        Region
      </h3>
      <label class="flex items-center gap-2 cursor-pointer group">
        <span class="text-[10px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">Auto Pick</span>
        <div class="relative flex items-center">
          <input
            type="checkbox"
            :checked="autoPickEnabled"
            @change="$emit('update:autoPickEnabled', ($event.target as HTMLInputElement).checked)"
            class="peer sr-only"
          />
          <div class="w-7 h-4 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
        </div>
      </label>
    </div>

    <div v-if="region" class="space-y-3">
      <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg font-mono text-[10px] space-y-2 shadow-sm">
        <div class="grid grid-cols-2 gap-2">
          <div class="space-y-1">
            <label class="text-slate-500 block">X1</label>
            <input
              type="number"
              :value="region.x1"
              @input="updateRegion('x1', ($event.target as HTMLInputElement).valueAsNumber)"
              class="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-slate-500 block">Y1</label>
            <input
              type="number"
              :value="region.y1"
              @input="updateRegion('y1', ($event.target as HTMLInputElement).valueAsNumber)"
              class="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-slate-500 block">X2</label>
            <input
              type="number"
              :value="region.x2"
              @input="updateRegion('x2', ($event.target as HTMLInputElement).valueAsNumber)"
              class="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div class="space-y-1">
            <label class="text-slate-500 block">Y2</label>
            <input
              type="number"
              :value="region.y2"
              @input="updateRegion('y2', ($event.target as HTMLInputElement).valueAsNumber)"
              class="w-full bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div class="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
          <span class="text-slate-500">Size:</span>
          <span class="font-bold text-indigo-600">{{ region.x2 - region.x1 }} x {{ region.y2 - region.y1 }}</span>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="$emit('reAutoSelect')" class="flex-1 px-3 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 text-indigo-600 text-xs font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Re-auto
        </button>
        <button @click="$emit('clearRegion')" class="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 active:bg-red-100 text-xs font-medium text-slate-600 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>
    </div>
    <div v-else class="text-xs text-slate-400 italic text-center py-4 border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/50">
      Drag on image to select region
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ColorInfo, Region } from '~/types'

const props = defineProps<{
  region: Region | null
  autoPickEnabled: boolean
}>()

const emit = defineEmits<{
  'update:autoPickEnabled': [value: boolean]
  'update:region': [value: Region]
  'clearRegion': []
  'reAutoSelect': []
}>()

function updateRegion(key: keyof Region, value: number) {
  if (!props.region || isNaN(value)) return
  const newRegion = { ...props.region, [key]: value }
  emit('update:region', newRegion)
}
</script>
