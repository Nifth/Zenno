<script lang="ts">
    import ToolLayout from '$lib/components/ToolLayout.svelte';
    import { copyToClipboard } from '$lib/utils/clipboard';
    import { formatJson, minifyJson, highlightJson, describeJsonError } from '$lib/utils/json';
    import type { JsonIndent, JsonError } from '$lib/utils/json';

    let input = $state('');
    let mode = $state<'beautify' | 'minify'>('beautify');
    let indent = $state<JsonIndent>(2);

    const indentOptions: { label: string; value: JsonIndent }[] = [
        { label: '2', value: 2 },
        { label: '4', value: 4 },
        { label: 'Tab', value: '\t' }
    ];

    let output = $derived.by(() => {
        if (!input.trim()) {
            return { value: '', error: null as JsonError | null };
        }
        try {
            const value = mode === 'minify' ? minifyJson(input) : formatJson(input, indent);
            return { value, error: null as JsonError | null };
        } catch (e) {
            return { value: '', error: describeJsonError(input, e) };
        }
    });

    let highlighted = $derived(output.value ? highlightJson(output.value) : '');

    let copied = $state(false);
    async function copyResult() {
        if (!output.value) return;
        if (await copyToClipboard(output.value)) {
            copied = true;
            setTimeout(() => (copied = false), 1500);
        }
    }
</script>

<ToolLayout title="JSON Formatter">
  {#snippet actions()}
    <div class="flex items-center gap-3">
      {#if mode === 'beautify'}
        <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
          {#each indentOptions as opt}
            <button
              onclick={() => (indent = opt.value)}
              class="px-3 py-1.5 cursor-pointer rounded-md transition-colors {indent === opt.value ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
            >
              {opt.label}
            </button>
          {/each}
        </div>
      {/if}

      <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button
          onclick={() => (mode = 'beautify')}
          class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'beautify' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
        >
          Beautify
        </button>
        <button
          onclick={() => (mode = 'minify')}
          class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'minify' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}"
        >
          Minify
        </button>
      </div>
    </div>
  {/snippet}

  <div class="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-0">
      <!-- Input Section -->
      <div class="flex-1 min-w-0 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
              <label for="json-input" class="font-bold uppercase tracking-wider text-neutral-500">Input</label>
              <span>Raw JSON</span>
          </div>
          <textarea
              id="json-input"
              bind:value={input}
              spellcheck="false"
              placeholder={'Paste your JSON here...\n\n{\n  "hello": "world"\n}'}
              class="w-full flex-1 min-h-64 lg:min-h-0 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 resize-none font-mono text-sm leading-relaxed"
          ></textarea>
      </div>

      <!-- Output Section -->
      <div class="flex-1 min-w-0 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center justify-between text-xs text-neutral-400 px-1 min-h-6">
              <div class="flex items-center gap-3">
                  <span class="font-bold uppercase tracking-wider text-neutral-500">Output</span>
                  {#if input.trim() && !output.error}
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Valid JSON
                      </span>
                  {:else if output.error}
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                          <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Invalid
                      </span>
                  {/if}
              </div>
              <button
                  type="button"
                  onclick={copyResult}
                  disabled={!output.value}
                  class="text-fuchsia-400 hover:text-fuchsia-300 font-semibold transition-colors disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer"
              >
                  {copied ? 'Copied ✓' : 'Copy Result'}
              </button>
          </div>

          <div class="w-full flex-1 min-h-64 lg:min-h-0 overflow-auto rounded-xl bg-neutral-900/30 border border-neutral-800/80 p-4 font-mono text-sm leading-relaxed">
              {#if highlighted}
                  <pre class="m-0 whitespace-pre break-words">{@html highlighted}</pre>
              {:else if output.error}
                  <span class="text-neutral-600">Fix the error to see formatted output…</span>
              {:else}
                  <span class="text-neutral-600">Formatted JSON will appear here…</span>
              {/if}
          </div>

          {#if output.error}
              <span class="text-xs text-red-400 font-semibold flex items-center gap-1.5">
                  ⚠️ {output.error.message}
                  {#if output.error.line}
                      <span class="text-red-400/70 font-normal">line {output.error.line}, column {output.error.column}</span>
                  {/if}
              </span>
          {:else}
              <!-- Color legend -->
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-500 px-1 pt-1">
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>string</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-sky-400"></span>number</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-400"></span>boolean</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-400"></span>null</span>
                  <span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-fuchsia-300"></span>key</span>
              </div>
          {/if}
      </div>
  </div>
</ToolLayout>
