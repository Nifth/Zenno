<script lang="ts">
    import ToolLayout from '$lib/components/ToolLayout.svelte';
    import { runRegex, highlightMatches } from '$lib/utils/regex';

    const FLAGS = [
        { key: 'g', title: 'global - find all matches' },
        { key: 'i', title: 'ignore case' },
        { key: 'm', title: 'multiline - ^ and $ match at line breaks' },
        { key: 's', title: 'dotall - . matches newlines' },
        { key: 'u', title: 'unicode' },
        { key: 'y', title: 'sticky' }
    ];

    let pattern = $state('');
    let test = $state('');
    let flagState = $state<Record<string, boolean>>({
        g: true, i: false, m: false, s: false, u: false, y: false
    });

    let flags = $derived(FLAGS.filter((f) => flagState[f.key]).map((f) => f.key).join(''));
    let result = $derived(runRegex(pattern, flags, test));
    let highlighted = $derived(highlightMatches(test, result.matches));
</script>

<ToolLayout title="Regex Tester">
  {#snippet actions()}
    <div class="inline-flex p-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-mono font-semibold gap-1">
      {#each FLAGS as f}
        <button
          title={f.title}
          onclick={() => (flagState[f.key] = !flagState[f.key])}
          class="w-7 h-7 flex items-center justify-center cursor-pointer rounded-md transition-colors {flagState[f.key] ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'text-neutral-500 hover:text-neutral-300'}"
        >
          {f.key}
        </button>
      {/each}
    </div>
  {/snippet}

  <div class="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 min-h-0">
      <!-- Left: pattern + test string -->
      <div class="flex-1 min-w-0 flex flex-col space-y-4 min-h-0">
          <!-- Pattern -->
          <div class="space-y-2">
              <label for="regex-pattern" class="block font-bold uppercase tracking-wider text-neutral-500 text-xs px-1">Pattern</label>
              <div class="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-900/60 border border-neutral-800 focus-within:border-fuchsia-500/50 focus-within:ring-1 focus-within:ring-fuchsia-500/50 font-mono text-sm">
                  <span class="text-neutral-600 select-none">/</span>
                  <input
                      id="regex-pattern"
                      bind:value={pattern}
                      spellcheck="false"
                      placeholder="pattern"
                      class="flex-1 min-w-0 bg-transparent text-neutral-100 placeholder-neutral-600 focus:outline-none"
                  />
                  <span class="text-neutral-600 select-none">/</span>
                  <span class="text-fuchsia-400 min-w-8">{flags}</span>
              </div>
              {#if result.error}
                  <span class="text-xs text-red-400 font-semibold flex items-center gap-1.5 px-1">
                      ⚠️ {result.error}
                  </span>
              {/if}
          </div>

          <!-- Test string with live highlight overlay -->
          <div class="flex-1 flex flex-col space-y-2 min-h-0">
              <label for="regex-test" class="font-bold uppercase tracking-wider text-neutral-500 text-xs px-1">Test String</label>
              <div class="relative w-full flex-1 min-h-64 lg:min-h-0 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden font-mono text-sm leading-relaxed">
                  <pre
                      class="absolute inset-0 m-0 p-4 whitespace-pre-wrap break-words overflow-y-auto pointer-events-none text-neutral-100 font-mono text-sm leading-relaxed"
                      aria-hidden="true"
                  >{@html highlighted || '<span class="text-neutral-600">Type or paste text to test against…</span>'}</pre>
                  <textarea
                      id="regex-test"
                      bind:value={test}
                      spellcheck="false"
                      class="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-fuchsia-400 resize-none outline-none whitespace-pre-wrap break-words overflow-y-auto font-mono text-sm leading-relaxed selection:bg-fuchsia-500/30"
                  ></textarea>
              </div>
          </div>
      </div>

      <!-- Right: matches -->
      <div class="flex-1 min-w-0 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center gap-3 px-1 min-h-6">
              <span class="font-bold uppercase tracking-wider text-neutral-500 text-xs">Matches</span>
              {#if result.error}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                      <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Invalid regex
                  </span>
              {:else if pattern && result.matches.length}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {result.matches.length}{result.truncated ? '+' : ''} match{result.matches.length > 1 ? 'es' : ''}
                  </span>
              {:else if pattern && test}
                  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 border border-neutral-700 text-neutral-400">
                      No match
                  </span>
              {/if}
          </div>

          <div class="flex-1 min-h-64 lg:min-h-0 overflow-auto rounded-xl bg-neutral-900/30 border border-neutral-800/80 p-3 font-mono text-xs space-y-2">
              {#if result.error}
                  <span class="text-red-400 font-semibold">⚠️ {result.error}</span>
              {:else if !pattern}
                  <span class="text-neutral-600">Enter a pattern to see matches…</span>
              {:else if !result.matches.length}
                  <span class="text-neutral-600">No matches in the test string.</span>
              {:else}
                  {#each result.matches as m, i}
                      <div class="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-2.5 space-y-1.5">
                          <div class="flex items-start justify-between gap-2">
                              <span class="text-fuchsia-300 break-all">{m.match || '∅ empty'}</span>
                              <span class="text-neutral-600 shrink-0">#{i + 1} @ {m.index}</span>
                          </div>
                          {#if m.groups.length}
                              <div class="space-y-0.5 pt-1.5 border-t border-neutral-800/60">
                                  {#each m.groups as g, gi}
                                      <div class="flex gap-2">
                                          <span class="text-neutral-600 shrink-0 w-10">grp {gi + 1}</span>
                                          <span class="break-all text-emerald-400">{g || '-'}</span>
                                      </div>
                                  {/each}
                                  {#each Object.entries(m.namedGroups) as [name, val]}
                                      <div class="flex gap-2">
                                          <span class="text-sky-400 shrink-0 break-all">{name}</span>
                                          <span class="break-all text-emerald-400">{val || '-'}</span>
                                      </div>
                                  {/each}
                              </div>
                          {/if}
                      </div>
                  {/each}
              {/if}
          </div>
      </div>
  </div>
</ToolLayout>
