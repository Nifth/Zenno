<script lang="ts">
    const features = [
        {
            label: "Base64 decode",
            colorTheme: "orange",
            link: "ouebeb",
        },
        {
            label: "Base64 encode",
            colorTheme: "lightorange",
            link: "ouebeb2",
        }
    ]
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

{#each features as feature}
    <div class="mb-8">
        <p>label: {feature.label}</p>
        <p>color: {feature.colorTheme}</p>
        <p>link: {feature.link}</p>
    </div>
{/each}
