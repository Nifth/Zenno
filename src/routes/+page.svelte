<script lang="ts">
import { features, activeFeatures } from "$lib/features"

const count = activeFeatures().length;
const widthClasses =
	count === 1
		? "w-full"
		: count === 2
			? "sm:w-[calc(50%-12px)] lg:w-[calc(50%-16px)] xl:w-[calc(50%-18px)]"
			: count === 3
				? "sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(33.333%-18px)]"
				: "sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)]";
</script>

<!-- Header (~180px) -->
<header class="h-45 shrink-0 border-b border-neutral-800 px-8 flex flex-col justify-center bg-neutral-900/30 backdrop-blur-md">
    <div class="max-w-7xl w-full mx-auto flex items-center justify-between">
        <div>
            <div class="flex items-center gap-3">
                <h1 class="text-4xl font-extrabold tracking-tight bg-linear-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
                    ZENNO
                </h1>
            </div>
            <p class="mt-2 text-sm text-neutral-400 max-w-xl leading-relaxed">
                Omnipotent, zero-telemetry developer toolbox. Built for ultra-fast local operations.
            </p>
        </div>

        <div class="hidden sm:flex items-center gap-6 text-xs text-neutral-500">
            <div>
                <span class="text-neutral-200 font-bold text-base block">{features.length}</span>
                Tools Total
            </div>
            <div class="h-8 w-px bg-neutral-800"></div>
            <div>
                <span class="text-fuchsia-400 font-bold text-base block">Offline</span>
                Privacy First
            </div>
        </div>
    </div>
</header>

<!-- Main Content / Fullscreen Grid (Prend tout le reste de la hauteur) -->
<main class="flex-1 overflow-y-auto p-8">
    <div class="max-w-7xl mx-auto flex flex-wrap justify-center gap-6 pb-12">
        {#each activeFeatures() as feature}
            <a
                href={`/${feature.id}`}
                class="group w-full {widthClasses} flex flex-col justify-between p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-fuchsia-500/50 transition-all"
            >
                <div>
                    <!-- Card Header -->
                    <div class="flex items-center justify-between mb-4">
                        <span class="text-2xl p-2.5 rounded-lg bg-neutral-800/80 group-hover:bg-fuchsia-500/10 transition-colors">
                            {feature.icon}
                        </span>
                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-neutral-800 text-neutral-400 group-hover:text-neutral-200">
                            {feature.category}
                        </span>
                    </div>

                    <!-- Tool Info -->
                    <h2 class="text-lg font-bold text-neutral-100 group-hover:text-fuchsia-400 transition-colors">
                        {feature.name}
                    </h2>
                    <p class="mt-2 text-xs text-neutral-400 leading-relaxed">
                        {feature.desc}
                    </p>
                </div>

                <!-- Card Footer -->
                <div class="mt-6 pt-4 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-500 group-hover:text-neutral-300">
                    <span>Open tool</span>
                    <span class="group-hover:translate-x-1 transition-transform font-bold text-fuchsia-400">→</span>
                </div>
            </a>
        {/each}
    </div>
</main>
