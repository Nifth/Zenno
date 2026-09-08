<script lang="ts">
    import ToolLayout from './ToolLayout.svelte';
    import { copyToClipboard } from '$lib/utils/clipboard';

    type Props = {
        title: string;
        encode: (input: string) => string;
        decode: (input: string) => string;
        inputHint?: string;
        errorMessage?: string;
    };

    let {
        title,
        encode,
        decode,
        inputHint = 'Raw String',
        errorMessage = 'Failed to process input.'
    }: Props = $props();

    let mode = $state<'encode' | 'decode'>('decode');
    let input = $state('');

    let result = $derived.by(() => {
        if (!input.trim()) {
            return { value: '', error: null as string | null };
        }
        try {
            const value = mode === 'encode' ? encode(input) : decode(input.trim());
            return { value, error: null as string | null };
        } catch {
            return { value: '', error: errorMessage };
        }
    });

    let copied = $state(false);
    async function copyResult() {
        if (!result.value) return;
        if (await copyToClipboard(result.value)) {
            copied = true;
            setTimeout(() => (copied = false), 1500);
        }
    }
</script>

<ToolLayout {title}>
  {#snippet actions()}
    <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
      <button
        onclick={() => (mode = 'encode')}
        class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'encode' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
      >
        Encode
      </button>
      <button
        onclick={() => (mode = 'decode')}
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
              <span>{inputHint}</span>
          </div>
          <textarea
              id="input-data"
              rows="8"
              bind:value={input}
              placeholder="Paste your content here..."
              class="w-full flex-1 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 resize-none font-mono text-sm leading-relaxed"
          ></textarea>
      </div>

      <!-- Output Section -->
      <div class="flex-1 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
              <label for="output-data" class="font-bold uppercase tracking-wider text-neutral-500">Output</label>
              <button
                  type="button"
                  onclick={copyResult}
                  disabled={!result.value}
                  class="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer"
              >
                  {copied ? 'Copied ✓' : 'Copy Result'}
              </button>
          </div>
          <textarea
              id="output-data"
              rows="8"
              readonly
              value={result.value}
              placeholder="Result will appear here..."
              class="w-full flex-1 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 text-fuchsia-400 placeholder-neutral-700 focus:outline-none resize-none font-mono text-sm leading-relaxed cursor-text focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
          ></textarea>
          {#if result.error}
              <span class="mt-1 text-xs text-red-400 font-semibold flex items-center gap-1">
              ⚠️ {result.error}
              </span>
          {/if}
      </div>
  </div>
</ToolLayout>
