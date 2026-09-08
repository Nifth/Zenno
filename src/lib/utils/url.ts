// URL percent-encoding helpers. We use the `*Component` variants so that
// reserved characters (& = ? / #) are encoded too - that is what people
// expect from a "URL encoder", unlike bare encodeURI which leaves them.

export function encodeUrl(input: string): string {
    return encodeURIComponent(input);
}

export function decodeUrl(input: string): string {
    return decodeURIComponent(input);
}
