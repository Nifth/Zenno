<script lang="ts">
    import ToolLayout from '$lib/components/ToolLayout.svelte';
    let mode = $state<'encode' | 'decode'>('decode');
</script>

{#snippet actions()}
    <!-- Toggle Encode / Decode -->
    <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button type="button" class="px-4 py-1.5 rounded-md text-neutral-400 hover:text-neutral-200 transition-colors">
        Encode
        </button>
        <button type="button" class="px-4 py-1.5 rounded-md bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 shadow-sm">
        Decode
        </button>
    </div>
{/snippet}
<ToolLayout title="Base64 Encoder / Decoder">
  {#snippet actions()}
    <!-- Les boutons sont injectés dans le header du layout -->
    <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
      <button 
        onclick={() => mode = 'encode'}
        class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'encode' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
      >
        Encode
      </button>
      <button 
        onclick={() => mode = 'decode'}
        class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'decode' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
      >
        Decode
      </button>
    </div>
  {/snippet}

  <!-- Main Grid (Input & Output Stack) -->
  <div class="flex-1 flex flex-col gap-6 min-h-0">
      <!-- Input Section -->
      <div class="flex-1 flex flex-col space-y-2 min-h-0">
              <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
              <label for="input-data" class="font-bold uppercase tracking-wider text-neutral-500">Input</label>
              <span>Raw String</span>
          </div>
              <textarea
              id="input-data"
              rows="8"
              placeholder="Paste your content here..."
              class="w-full flex-1 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 resize-none font-mono text-sm leading-relaxed"
              ></textarea>
      </div>
  
      <!-- Output Section -->
      <div class="flex-1 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
              <label for="output-data" class="font-bold uppercase tracking-wider text-neutral-500">Output</label>
              <button type="button" class="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors">
                  Copy Result
              </button>
          </div>
              <textarea
              id="output-data"
              rows="8"
              readonly
              placeholder="Result will appear here..."
              class="w-full flex-1 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 text-fuchsia-400 placeholder-neutral-700 focus:outline-none resize-none font-mono text-sm leading-relaxed cursor-text"
              ></textarea>
      </div>
  
  </div>
</ToolLayout>
