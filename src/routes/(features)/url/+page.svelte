<script lang="ts">
    import ConverterTool from '$lib/components/ConverterTool.svelte';
    import { encodeUrl, decodeUrl } from '$lib/utils/url';
</script>

<ConverterTool
    title="URL Encoder / Decoder"
    encode={encodeUrl}
    decode={decodeUrl}
    errorMessage="Invalid URL string: failed to decode input."
/>
