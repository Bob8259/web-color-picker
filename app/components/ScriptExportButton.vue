<template>
  <div class="space-y-2">
    <button
      @click="$emit('copy')"
      :disabled="!canExport"
      class="px-3 py-2 bg-white border border-gray-400 hover:bg-gray-50 active:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed w-full font-bold uppercase tracking-widest text-xs"
    >
      <span v-if="copySuccess">Copied!</span>
      <span v-else>Copy Script</span>
    </button>
    <p v-if="!canExport" class="text-[9px] text-gray-400 text-center">
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
