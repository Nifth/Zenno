<script lang="ts">
    import ToolLayout from '$lib/components/ToolLayout.svelte';
    import { copyToClipboard } from '$lib/utils/clipboard';
    import { diffLines, foldRows, toUnifiedPatch, type Row, type Segment } from '$lib/utils/diff';
    import { diffJson } from '$lib/utils/jsonDiff';

    let original = $state('');
    let changed = $state('');
    let mode = $state<'text' | 'json'>('text');
    let view = $state<'split' | 'unified'>('split');

    // Fold keys the user has expanded. Keys are content-derived (stable across
    // identical content), so an untouched region stays open while editing
    // elsewhere; a region that shifts simply re-collapses. Reassigned (not
    // mutated) so Svelte tracks it.
    let expanded = $state<Set<string>>(new Set());

    const hasContent = $derived(original !== '' || changed !== '');

    // Text mode diffs the raw text; JSON mode normalizes both sides (sorted
    // keys, fixed indent) then diffs - see jsonDiff.ts. Both yield the same
    // row model, so everything below is mode-agnostic.
    const computed = $derived.by(() => {
        if (mode === 'json') return diffJson(original, changed);
        return { result: diffLines(original, changed), error: null };
    });

    const chunks = $derived(computed.result ? foldRows(computed.result.rows, 3) : []);
    const identical = $derived(
        !!computed.result && computed.result.added === 0 && computed.result.removed === 0
    );

    function expand(key: string) {
        expanded = new Set(expanded).add(key);
    }

    let copied = $state(false);
    async function copy() {
        const rows = computed.result?.rows;
        if (!rows?.length) return;
        if (await copyToClipboard(toUnifiedPatch(rows))) {
            copied = true;
            setTimeout(() => (copied = false), 1500);
        }
    }

    // Expand a `replace` row into a delete line + an insert line for the
    // unified view; every other kind maps to a single line.
    type UniLine = {
        numL: number | null;
        numR: number | null;
        sign: ' ' | '-' | '+';
        tone: 'equal' | 'del' | 'ins';
        segments: Segment[];
    };
    function unify(row: Row): UniLine[] {
        switch (row.kind) {
            case 'equal':
                return [{ numL: row.left!.num, numR: row.right!.num, sign: ' ', tone: 'equal', segments: row.left!.segments }];
            case 'delete':
                return [{ numL: row.left!.num, numR: null, sign: '-', tone: 'del', segments: row.left!.segments }];
            case 'insert':
                return [{ numL: null, numR: row.right!.num, sign: '+', tone: 'ins', segments: row.right!.segments }];
            case 'replace':
                return [
                    { numL: row.left!.num, numR: null, sign: '-', tone: 'del', segments: row.left!.segments },
                    { numL: null, numR: row.right!.num, sign: '+', tone: 'ins', segments: row.right!.segments }
                ];
        }
    }
</script>

<!-- Renders a line's text, wrapping the word-level changed runs in a highlight. -->
{#snippet content(segments: Segment[], changedCls: string)}
    {#each segments as s}{#if s.kind === 'changed'}<span class={changedCls}>{s.text}</span>{:else}{s.text}{/if}{/each}
{/snippet}

<ToolLayout title="Diff Viewer">
  {#snippet actions()}
    <div class="flex items-center gap-3">
      <!-- Mode: text vs structural JSON -->
      <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button onclick={() => (mode = 'text')} class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'text' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}">Text</button>
        <button onclick={() => (mode = 'json')} class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {mode === 'json' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}">JSON</button>
      </div>
      <!-- View: side-by-side vs unified -->
      <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
        <button onclick={() => (view = 'split')} title="Side-by-side" class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {view === 'split' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}">Split</button>
        <button onclick={() => (view = 'unified')} title="Inline / unified" class="px-4 py-1.5 cursor-pointer rounded-md transition-colors {view === 'unified' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-400'}">Unified</button>
      </div>
    </div>
  {/snippet}

  <div class="flex-1 flex flex-col gap-4 min-h-0">
      <!-- Inputs -->
      <div class="grid grid-cols-2 gap-4 shrink-0">
          <div class="flex flex-col space-y-2">
              <label for="diff-original" class="font-bold uppercase tracking-wider text-neutral-500 text-xs px-1">Original</label>
              <textarea
                  id="diff-original"
                  bind:value={original}
                  spellcheck="false"
                  placeholder={mode === 'json' ? '{ "paste": "original JSON" }' : 'Paste the original text…'}
                  class="w-full h-36 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 resize-none font-mono text-xs leading-relaxed"
              ></textarea>
          </div>
          <div class="flex flex-col space-y-2">
              <label for="diff-changed" class="font-bold uppercase tracking-wider text-neutral-500 text-xs px-1">Changed</label>
              <textarea
                  id="diff-changed"
                  bind:value={changed}
                  spellcheck="false"
                  placeholder={mode === 'json' ? '{ "paste": "changed JSON" }' : 'Paste the changed text…'}
                  class="w-full h-36 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 resize-none font-mono text-xs leading-relaxed"
              ></textarea>
          </div>
      </div>

      <!-- Diff header: stats + copy -->
      <div class="flex items-center justify-between px-1 min-h-6 shrink-0">
          <div class="flex items-center gap-3">
              <span class="font-bold uppercase tracking-wider text-neutral-500 text-xs">Diff</span>
              {#if computed.error}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Invalid JSON ({computed.error.side})
                  </span>
              {:else if hasContent && identical}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 border border-neutral-700 text-neutral-400">No differences</span>
              {:else if computed.result && hasContent}
                  {#if computed.result.added}
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">+{computed.result.added}</span>
                  {/if}
                  {#if computed.result.removed}
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">−{computed.result.removed}</span>
                  {/if}
                  {#if computed.result.truncated}
                      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400" title="Inputs too large to diff minimally - showing a coarse result">simplified</span>
                  {/if}
              {/if}
          </div>
          <button
              type="button"
              onclick={copy}
              disabled={!computed.result?.rows.length || identical}
              class="text-xs font-semibold text-fuchsia-400 hover:text-fuchsia-300 transition-colors disabled:text-neutral-600 disabled:cursor-not-allowed cursor-pointer"
          >
              {copied ? 'Copied ✓' : 'Copy diff'}
          </button>
      </div>

      <!-- Diff surface: one scroll container → both panes scroll in sync -->
      <div class="flex-1 min-h-0 overflow-auto rounded-xl bg-neutral-900/30 border border-neutral-800/80 font-mono text-xs leading-5">
          {#if computed.error}
              <div class="p-4 text-red-400 font-semibold">
                  ⚠️ Invalid JSON in the {computed.error.side} pane: {computed.error.message}{#if computed.error.line} (line {computed.error.line}{#if computed.error.column}, column {computed.error.column}{/if}){/if}
              </div>
          {:else if !hasContent}
              <div class="p-4 text-neutral-600">Paste content in both panes to see the difference…</div>
          {:else}
              {#each chunks as chunk (chunk.type === 'fold' ? chunk.key : chunk.rows[0]?.left?.num ?? Math.random())}
                  {#if chunk.type === 'fold' && !expanded.has(chunk.key)}
                      <button
                          type="button"
                          onclick={() => expand(chunk.key)}
                          class="w-full flex items-center gap-2 px-4 py-1.5 text-neutral-500 hover:text-fuchsia-400 hover:bg-neutral-800/40 bg-neutral-900/40 border-y border-neutral-800/60 transition-colors cursor-pointer"
                      >
                          <span class="text-neutral-600">⋯</span>
                          Expand {chunk.count} unchanged line{chunk.count > 1 ? 's' : ''}
                      </button>
                  {:else if view === 'split'}
                      {#each chunk.rows as row}
                          {@const leftBg = row.left ? (row.kind === 'delete' || row.kind === 'replace' ? 'bg-red-500/10' : '') : 'bg-neutral-900/40'}
                          {@const rightBg = row.right ? (row.kind === 'insert' || row.kind === 'replace' ? 'bg-emerald-500/10' : '') : 'bg-neutral-900/40'}
                          <div class="flex min-h-5">
                              <div class="flex-1 min-w-0 flex {leftBg}">
                                  <span class="select-none text-right text-neutral-600 w-10 shrink-0 pr-2">{row.left?.num ?? ''}</span>
                                  <span class="flex-1 min-w-0 whitespace-pre-wrap break-all pr-3 {row.kind === 'equal' ? 'text-neutral-400' : 'text-neutral-200'}">{#if row.left}{@render content(row.left.segments, 'bg-red-500/30 text-red-100 rounded-sm')}{/if}</span>
                              </div>
                              <div class="flex-1 min-w-0 flex border-l border-neutral-800 {rightBg}">
                                  <span class="select-none text-right text-neutral-600 w-10 shrink-0 px-2">{row.right?.num ?? ''}</span>
                                  <span class="flex-1 min-w-0 whitespace-pre-wrap break-all pr-3 {row.kind === 'equal' ? 'text-neutral-400' : 'text-neutral-200'}">{#if row.right}{@render content(row.right.segments, 'bg-emerald-500/30 text-emerald-100 rounded-sm')}{/if}</span>
                              </div>
                          </div>
                      {/each}
                  {:else}
                      {#each chunk.rows as row}
                          {#each unify(row) as u}
                              {@const bg = u.tone === 'del' ? 'bg-red-500/10' : u.tone === 'ins' ? 'bg-emerald-500/10' : ''}
                              {@const changedCls = u.tone === 'del' ? 'bg-red-500/30 text-red-100 rounded-sm' : 'bg-emerald-500/30 text-emerald-100 rounded-sm'}
                              {@const signCls = u.tone === 'del' ? 'text-red-400' : u.tone === 'ins' ? 'text-emerald-400' : 'text-neutral-700'}
                              <div class="flex min-h-5 {bg}">
                                  <span class="select-none text-right text-neutral-600 w-10 shrink-0 pr-2">{u.numL ?? ''}</span>
                                  <span class="select-none text-right text-neutral-600 w-10 shrink-0 pr-2">{u.numR ?? ''}</span>
                                  <span class="select-none w-4 shrink-0 text-center {signCls}">{u.sign}</span>
                                  <span class="flex-1 min-w-0 whitespace-pre-wrap break-all pr-3 {u.tone === 'equal' ? 'text-neutral-400' : 'text-neutral-200'}">{@render content(u.segments, changedCls)}</span>
                              </div>
                          {/each}
                      {/each}
                  {/if}
              {/each}
          {/if}
      </div>
  </div>
</ToolLayout>
