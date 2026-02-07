<template>
  <div class="px-4 py-3 border-t border-violet-100 flex-shrink-0">
    <button
      @click="$emit('copy')"
      :disabled="!canExport"
      class="w-full py-2.5 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2"
      :class="copySuccess
        ? 'bg-green-500 text-white shadow-lg shadow-green-200'
        : canExport
          ? 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:scale-[1.02] cursor-pointer'
          : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
    >
      <span v-if="copySuccess">✓ Copied!</span>
      <span v-else>📋 Copy Script Format</span>
    </button>
    <p v-if="!canExport" class="text-[0.65rem] text-gray-400 mt-1.5 text-center">
      Select a region and pick colors first
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
