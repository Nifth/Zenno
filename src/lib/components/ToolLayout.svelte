<script lang="ts">
  import type { Snippet } from 'svelte';

  let { title, actions, children }: { title: string; actions?: Snippet; children: Snippet } = $props();
</script>

<div class="flex flex-col h-full p-8 space-y-6">
  <div class="flex items-center justify-between pb-4 border-b border-neutral-800">
    <h1 class="text-2xl font-extrabold tracking-tight text-neutral-100">{title}</h1>
    
    {#if actions}
      <div>{@render actions()}</div>
    {/if}
  </div>

  <div class="flex-1 flex flex-col gap-6 min-h-0">
    {@render children()}
  </div>
</div>