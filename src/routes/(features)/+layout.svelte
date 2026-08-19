<script lang="ts">
    import { activeFeatures } from "$lib/features"
    import { page } from '$app/stores';  
    import type { Snippet } from 'svelte';
    
	let { actions, children }: { actions?: Snippet; children: Snippet } = $props();
    
    const currentFeature = activeFeatures().find((f) => {
        return $page.url.pathname.includes(f.id)
    })
</script>

<div class="flex">
    <!-- Sidebar -->
    <aside class="w-64 shrink-0 border-r border-neutral-800 bg-neutral-900/40 flex flex-col justify-between select-none h-screen">
    	<div>
    		<!-- Top Link / Logo Home -->
    		<div class="h-16 border-b border-neutral-800/80 px-6 flex items-center">
    			<a 
    				href="/" 
    				class="group flex items-center gap-2 text-xl font-black tracking-tight text-neutral-100 hover:text-fuchsia-400 transition-colors"
    			>
    				<span class="text-fuchsia-500 group-hover:-translate-x-0.5 transition-transform">←</span>
    				<span class="text-4xl font-extrabold tracking-tight bg-linear-to-r from-purple-400 to-fuchsia-500 bg-clip-text text-transparent">
    					ZENNO
    				</span>
    			</a>
    		</div>
    
    		<!-- Navigation Features -->
    		<nav class="p-3 space-y-1">
    			<div class="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
    				Tools
    			</div>
    
    			{#each activeFeatures() as feature}
    				{@const isActive = $page.url.pathname.includes(feature.id)}
    				<a
    					href={`/tools/${feature.id}`}
    					class="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
    						{isActive 
    							? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 font-semibold' 
    							: 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200 border border-transparent'}"
    				>
    					<span class="text-base">{feature.icon}</span>
    					<span class="truncate">{feature.name}</span>
    				</a>
    			{/each}
    		</nav>
    	</div>
    
    	<!-- Small Footer Info -->
    	<div class="p-4 border-t border-neutral-800/60 text-[11px] text-neutral-500 flex items-center justify-between">
    		<span>Local & Offline</span>
    		<span class="w-2 h-2 rounded-full bg-fuchsia-500/80 animate-pulse"></span>
    	</div>
    </aside>
    
    <!-- Zone de contenu principal de la Feature -->
    <main class="flex-1 overflow-y-auto p-8">
       	{@render children()}
    </main>
</div>
