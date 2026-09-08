// JSON format / minify / validate + syntax highlighting.
// Formatting IS validation: JSON.parse throws on invalid input, so a successful
// format proves the document is well-formed.

export type JsonIndent = 2 | 4 | '\t';

export function formatJson(input: string, indent: JsonIndent = 2): string {
    return JSON.stringify(JSON.parse(input), null, indent);
}

export function minifyJson(input: string): string {
    return JSON.stringify(JSON.parse(input));
}

export type JsonError = { message: string; line: number | null; column: number | null };

// Turn a JSON.parse SyntaxError into a friendly message with a location.
// V8 messages embed a byte offset ("... in JSON at position 42 (line 3 column 5)"),
// which we normalize into an engine-independent line/column pair.
export function describeJsonError(input: string, err: unknown): JsonError {
    const raw = err instanceof Error ? err.message : 'Invalid JSON';
    const posMatch = raw.match(/position (\d+)/);
    let line: number | null = null;
    let column: number | null = null;

    if (posMatch) {
        const pos = Number(posMatch[1]);
        const before = input.slice(0, pos);
        line = before.split('\n').length;
        column = pos - before.lastIndexOf('\n');
    }

    // Drop the noisy "in JSON at position N (...)" tail for a cleaner headline.
    const message = raw.replace(/\s+in JSON at position.*$/, '').trim() || 'Invalid JSON';
    return { message, line, column };
}

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Wrap JSON tokens in colored <span>s. The input is HTML-escaped FIRST, so the
// result is safe to inject via {@html}. Keys and strings both open with a quote,
// so they are disambiguated by the trailing colon that keys carry.
export function highlightJson(json: string): string {
    const tokens =
        /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

    return escapeHtml(json).replace(tokens, (match) => {
        let cls = 'text-sky-400'; // number / float - "weird blue"
        if (match.startsWith('"')) {
            cls = match.trimEnd().endsWith(':')
                ? 'text-fuchsia-300' // object key
                : 'text-emerald-400'; // string - "weird green"
        } else if (match === 'true' || match === 'false') {
            cls = 'text-orange-400'; // boolean
        } else if (match === 'null') {
            cls = 'text-purple-400'; // null
        }
        return `<span class="${cls}">${match}</span>`;
    });
}
