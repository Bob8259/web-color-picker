<template>
  <div class="space-y-3">
    <button
      @click="$emit('copy')"
      :disabled="!canExport"
      class="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 active:from-indigo-800 active:to-violet-800 disabled:from-slate-300 disabled:to-slate-400 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-xs rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <svg v-if="copySuccess" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
      </svg>
      <span v-if="copySuccess">Copied!</span>
      <span v-else>Copy Script</span>
    </button>
    <p v-if="!canExport" class="text-[10px] text-slate-400 text-center italic">
      Select region and pick colors first
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canExport: boolean
  copySuccess: boolean
}>()

defineEmits<{
  copy: []
}>()
</script>
