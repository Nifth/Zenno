<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<title>Zenno · Developer Toolbox</title>
	<link rel="icon" href={favicon} />
</svelte:head>
<div class="h-screen w-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden font-mono selection:bg-purple-500 selection:text-white">
{@render children()}
</div>
