<script lang="ts">
    import ToolLayout from '$lib/components/ToolLayout.svelte';
    import { parseJwt } from "$lib/utils/jwt";
    let mode = $state<'encode' | 'decode'>('decode');
    let input = $state('')

    let result = $derived.by(() => {
        if (!input.trim()) {
                return { value: '', error: null };
            }
        try {
            if (mode === 'encode') {
                return { value: 'Not implemented yet', error: 'Not implemented yet' };
            }
            const decoded = parseJwt(input.trim());
            return {
                payload: JSON.stringify(decoded.payload, null, 2),
                header: JSON.stringify(decoded.header, null, 2),
                signature: decoded.signature,
                error: null
            };
        } catch {
            return {
                value: '',
                error: 'Invalid JWT string: failed to decode input.'
            };
        }
    })
    let expiration = $derived.by(() => {
        const payload = JSON.parse(result?.payload || "{}")
        if (!payload.exp) return null;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        return {
            expired: payload.exp < nowInSeconds,
            readableDate: new Date(payload.exp * 1000).toLocaleString()
        }
    });

    let highlightedJwt = $derived.by(() => {
        if (!input) return '';

        const parts = input.trim().split('.');

        const header = parts[0]
            ? `<span class="text-orange-600">${parts[0]}</span>`
            : '';
        const payload = parts[1]
            ? `<span class="text-indigo-500">${parts[1]}</span>`
            : '';
        const signature = parts[2]
            ? `<span class="text-emerald-600">${parts[2]}</span>`
            : '';

        const dots = `<span class="text-neutral-600 font-bold">.</span>`;

        return parts.slice(0, 3).map((_, i) => {
            if (i === 0) return header;
            if (i === 1) return payload;
            return signature;
        }).join(dots);
    });
</script>

<ToolLayout title="JWT Decoder">
  <!-- Main Grid (Input & Output Stack) -->
  <div class="flex-1 flex flex-row gap-24 min-h-0">
      <!-- Input Section -->
      <div class="flex-1 flex flex-col space-y-2 min-h-0">
          <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
              <label for="input-data" class="font-bold uppercase tracking-wider text-neutral-500">Input</label>
              <span>Raw JWT</span>
          </div>
          <div class="relative w-full h-200 bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden font-mono text-sm leading-relaxed">
          <pre
              class="absolute inset-0 m-0 p-4 border border-transparent whitespace-pre-wrap break-all overflow-y-auto pointer-events-none font-mono text-sm leading-[1.425rem] tracking-normal antialiased"
              aria-hidden="true"
            >{@html highlightedJwt || '<span class="text-neutral-600">Paste JWT here...</span>'}</pre>

            <textarea
              bind:value={input}
              spellcheck="false"
              class="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-fuchsia-400 resize-none outline-none whitespace-pre-wrap break-all overflow-y-auto font-mono text-sm leading-relaxed selection:bg-neutral-800 selection:text-transparent"
            ></textarea>
          </div>

            {#if result.error}
                <span class="mt-1 text-xs text-red-400 font-semibold flex items-center gap-1">
                ⚠️ {result.error}
                </span>
            {/if}
      </div>

      <!-- Output Section -->
      <div class="flex-1 flex flex-col space-y-2 min-h-0">
          <div class="flex flex-1 flex-col space-y-2">
            <div class="flex items-center justify-between text-xs text-neutral-400 px-1">
                <label for="output-data" class="font-bold uppercase tracking-wider text-orange-600">Decoded Header</label>
            </div>
            <textarea
                id="output-data"
                rows="8"
                readonly
                bind:value={result.header}
                placeholder="Header will appear here..."
                class="w-full flex-1 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 placeholder-neutral-700 focus:outline-none resize-none font-mono text-sm leading-relaxed cursor-text focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
            ></textarea>
          </div>


            <div class="flex flex-1 flex-col pt-6 space-y-2">
                <div class="flex items-center justify-between text-xs text-neutral-400 min-h-8">
                    <label for="output-data" class="font-bold uppercase tracking-wider text-indigo-500">Decoded Payload</label>

                    {#if expiration?.expired !== undefined}
                      <div class="flex items-center gap-3">
                        <span class="text-xs text-neutral-400">
                          Expires: <strong class="text-neutral-200">{expiration.readableDate}</strong>
                        </span>
                        {#if expiration.expired}
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400">
                          <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Expired
                        </div>
                        {:else}
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Valid Token
                        </div>
                        {/if}
                      </div>
                    {/if}
                </div>
                <textarea
                    id="output-data"
                    rows="8"
                    readonly
                    bind:value={result.payload}
                    placeholder="Payload will appear here..."
                    class="w-full flex-1 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 placeholder-neutral-700 focus:outline-none resize-none font-mono text-sm leading-relaxed cursor-text focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
                ></textarea>
            </div>

            <div class="flex flex-1 flex-col pt-6 space-y-2">
                <div class="flex items-center justify-between text-xs text-neutral-400">
                    <label for="output-data" class="font-bold uppercase tracking-wider text-emerald-600">Signature</label>
                </div>
                <textarea
                    id="output-data"
                    rows="8"
                    readonly
                    bind:value={result.signature}
                    placeholder="Signature will appear here..."
                    class="w-full flex-1 p-4 rounded-xl bg-neutral-900/30 border border-neutral-800/80 placeholder-neutral-700 focus:outline-none resize-none font-mono text-sm leading-relaxed cursor-text focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
                ></textarea>
            </div>
      </div>

  </div>
</ToolLayout>
