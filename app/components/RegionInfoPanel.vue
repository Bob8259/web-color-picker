<template>
  <div class="p-4 border-t border-gray-200">
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold uppercase tracking-wider text-gray-600">Region</h3>
      <label class="flex items-center gap-2 cursor-pointer">
        <span class="text-[10px] text-gray-500">Auto Pick</span>
        <input
          type="checkbox"
          :checked="autoPickEnabled"
          @change="$emit('update:autoPickEnabled', ($event.target as HTMLInputElement).checked)"
          class="w-3 h-3"
        />
      </label>
    </div>

    <div v-if="region" class="space-y-3">
      <div class="bg-gray-50 border border-gray-200 p-2 font-mono text-[10px] space-y-1">
        <div class="flex justify-between">
          <span>From:</span>
          <span>{{ region.x1 }}, {{ region.y1 }}</span>
        </div>
        <div class="flex justify-between">
          <span>To:</span>
          <span>{{ region.x2 }}, {{ region.y2 }}</span>
        </div>
        <div class="flex justify-between border-t border-gray-200 pt-1">
          <span>Size:</span>
          <span>{{ region.x2 - region.x1 }}x{{ region.y2 - region.y1 }}</span>
        </div>
      </div>
      <button @click="$emit('clearRegion')" class="px-3 py-1 bg-white border border-gray-400 hover:bg-gray-50 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs w-full">Clear</button>
    </div>
    <div v-else class="text-[10px] text-gray-400 italic">
      Drag on image to select
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
