// Regex matching + match highlighting, on top of the native RegExp engine.
// NOTE: RegExp runs synchronously, so a pathological pattern (catastrophic
// backtracking) can freeze the tab. That is acceptable for a local, offline
// tester where the user runs their own patterns; there is no worker/timeout.

export type RegexMatch = {
    match: string;
    index: number;
    groups: string[]; // numbered capture groups (1..n)
    namedGroups: Record<string, string>;
};

export type RegexResult = {
    matches: RegexMatch[];
    error: string | null;
    truncated: boolean;
};

const MAX_MATCHES = 10_000;

function toMatch(m: RegExpExecArray): RegexMatch {
    const [, ...groups] = m;
    return {
        match: m[0],
        index: m.index,
        groups: groups.map((g) => g ?? ''),
        namedGroups: Object.fromEntries(
            Object.entries(m.groups ?? {}).map(([k, v]) => [k, v ?? ''])
        )
    };
}

export function runRegex(pattern: string, flags: string, text: string): RegexResult {
    if (!pattern) return { matches: [], error: null, truncated: false };

    let re: RegExp;
    try {
        re = new RegExp(pattern, flags);
    } catch (e) {
        return {
            matches: [],
            error: e instanceof Error ? e.message : 'Invalid regular expression',
            truncated: false
        };
    }

    const matches: RegexMatch[] = [];
    let truncated = false;
    const global = re.global || re.sticky;

    if (!global) {
        const m = re.exec(text);
        if (m) matches.push(toMatch(m));
    } else {
        let m: RegExpExecArray | null;
        while ((m = re.exec(text)) !== null) {
            matches.push(toMatch(m));
            // A zero-length match does not advance lastIndex - bump it manually
            // to avoid an infinite loop.
            if (m.index === re.lastIndex) re.lastIndex++;
            if (matches.length >= MAX_MATCHES) {
                truncated = true;
                break;
            }
        }
    }

    return { matches, error: null, truncated };
}

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Two alternating highlight styles so adjacent matches stay distinguishable.
const HIGHLIGHTS = [
    'bg-fuchsia-500/30 text-fuchsia-100 rounded-sm',
    'bg-purple-500/30 text-purple-100 rounded-sm'
];

// Wrap matched spans of `text` in colored <span>s. The text is HTML-escaped
// FIRST, so the result is safe to inject via {@html}. Zero-length matches are
// counted elsewhere but not highlighted (nothing to wrap).
export function highlightMatches(text: string, matches: RegexMatch[]): string {
    if (!matches.length) return escapeHtml(text);

    let html = '';
    let cursor = 0;
    let painted = 0;

    for (const m of matches) {
        if (m.index < cursor || m.match === '') continue; // skip overlaps / empties
        html += escapeHtml(text.slice(cursor, m.index));
        const cls = HIGHLIGHTS[painted % HIGHLIGHTS.length];
        html += `<span class="${cls}">${escapeHtml(m.match)}</span>`;
        cursor = m.index + m.match.length;
        painted++;
    }
    html += escapeHtml(text.slice(cursor));
    return html;
}
