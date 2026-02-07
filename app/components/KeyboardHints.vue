<template>
  <div class="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[10px] text-slate-500 space-y-2 shadow-sm">
    <div class="flex items-center gap-2 mb-1 pb-1 border-b border-slate-200">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      <span class="font-bold uppercase tracking-wider">Shortcuts</span>
    </div>
    <div class="flex justify-between items-center">
      <span class="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 shadow-sm">PgUp/Dn</span>
      <span>Images</span>
    </div>
    <div class="flex justify-between items-center">
      <span class="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 shadow-sm">Arrows</span>
      <span>Move</span>
    </div>
    <div class="flex justify-between items-center">
      <span class="font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 shadow-sm">Ctrl + 0-9</span>
      <span>Save</span>
    </div>
  </div>
</template>
