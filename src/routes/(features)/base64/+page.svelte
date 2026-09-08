<script lang="ts">
    import ConverterTool from '$lib/components/ConverterTool.svelte';
    import { encodeBase64, decodeBase64 } from '$lib/utils/base64';
</script>

<ConverterTool
    title="Base64 Encoder / Decoder"
    encode={encodeBase64}
    decode={decodeBase64}
    errorMessage="Invalid Base64 string: failed to decode input."
/>
