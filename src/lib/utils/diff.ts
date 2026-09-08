// Text diff on top of a hand-rolled Myers O(ND) engine.
// 
// The whole module produces ONE display model (an array of aligned `Row`s)
// reused verbatim by the JSON mode (see jsonDiff.ts, which normalizes JSON to
// text and calls diffLines). The Svelte page renders that model as split or
// unified, folds unchanged runs, and highlights intra-line word changes.

export type SegmentKind = 'same' | 'changed';

// A run of text within a line, flagged as unchanged or part of the word-level
// change. Concatenating a line's segment texts reproduces the raw line.
export interface Segment {
    text: string;
    kind: SegmentKind;
}

export interface Line {
    num: number; // 1-based line number on its own side
    segments: Segment[];
}

// equal   => identical line on both sides
// delete  => line present only on the left (right is a filler)
// insert  => line present only on the right (left is a filler)
// replace => a changed line: old on the left, new on the right, same row
export type RowKind = 'equal' | 'delete' | 'insert' | 'replace';

export interface Row {
    kind: RowKind;
    left: Line | null; // null = filler cell (keeps sides aligned)
    right: Line | null;
}

export interface DiffResult {
    rows: Row[];
    added: number; // line count: inserts + replaces
    removed: number; // line count: deletes + replaces
    // True when the input was too large to diff minimally and we fell back to a
    // coarse "replace everything" result. The UI surfaces this.
    truncated: boolean;
}

// --- Myers core ------------------------------------------------------------

export type EditOp =
    | { type: 'equal'; aIndex: number; bIndex: number }
    | { type: 'delete'; aIndex: number }
    | { type: 'insert'; bIndex: number };

// Memory guard. The backtrace keeps one V array (length ~2·(N+M)) per edit-
// distance step, so worst-case memory ~ D·(N+M). We cap the running product of
// cells and bail to a trivial diff rather than risk freezing the tab. Near-identical
// inputs (the common "two versions of one file" case) have tiny D and never hit
// this, even for very large files.
const MAX_TRACE_CELLS = 20_000_000;

/**
 * Shortest edit script between two token arrays, in order. Generic over the
 * token type so it serves both line-level (tokens = lines) and word-level
 * (tokens = words) diffing.
 *
 * Returns `null` when the guard trips, signalling the caller to fall back.
 */
export function myers<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): EditOp[] | null {
    const n = a.length;
    const m = b.length;
    const max = n + m;

    if (max === 0) return [];

    const len = 2 * max + 3;
    const offset = max + 1;
    const v = new Int32Array(len);
    const trace: Int32Array[] = [];

    let solved = -1;
    outer: for (let d = 0; d <= max; d++) {
        if ((trace.length + 1) * len > MAX_TRACE_CELLS) return null; // guard
        trace.push(v.slice());

        for (let k = -d; k <= d; k += 2) {
            // Move down (insertion from b) or right (deletion from a),
            // greedily following whichever reaches further.
            let x: number;
            if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
                x = v[offset + k + 1];
            } else {
                x = v[offset + k - 1] + 1;
            }
            let y = x - k;
            while (x < n && y < m && eq(a[x], b[y])) {
                x++;
                y++;
            }
            v[offset + k] = x;
            if (x >= n && y >= m) {
                solved = d;
                break outer;
            }
        }
    }

    if (solved < 0) return null; // exhausted without solving (shouldn't happen)

    // Backtrace: replay the recorded V snapshots from the end to the start,
    // emitting diagonal (equal) moves and the single edit at each depth.
    const ops: EditOp[] = [];
    let x = n;
    let y = m;
    for (let d = solved; d > 0; d--) {
        const vd = trace[d];
        const k = x - y;

        let prevK: number;
        if (k === -d || (k !== d && vd[offset + k - 1] < vd[offset + k + 1])) {
            prevK = k + 1;
        } else {
            prevK = k - 1;
        }
        const prevX = vd[offset + prevK];
        const prevY = prevX - prevK;

        while (x > prevX && y > prevY) {
            ops.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
            x--;
            y--;
        }
        if (x === prevX) {
            ops.push({ type: 'insert', bIndex: prevY });
        } else {
            ops.push({ type: 'delete', aIndex: prevX });
        }
        x = prevX;
        y = prevY;
    }
    // The very first diagonal (before any edit) at depth 0.
    while (x > 0 && y > 0) {
        ops.push({ type: 'equal', aIndex: x - 1, bIndex: y - 1 });
        x--;
        y--;
    }

    ops.reverse();
    return ops;
}

// --- Word-level diff -------------------------------------------------------

// Split a line into words, whitespace runs, and individual punctuation chars,
// keeping every character so the pieces re-concatenate to the original line.
const WORD_TOKENS = /(\s+|[A-Za-z0-9_]+|[^\sA-Za-z0-9_])/g;

function tokenizeWords(line: string): string[] {
    return line.match(WORD_TOKENS) ?? [];
}

function pushSegment(segments: Segment[], text: string, kind: SegmentKind): void {
    if (!text) return;
    const last = segments[segments.length - 1];
    if (last && last.kind === kind) last.text += text; // coalesce
    else segments.push({ text, kind });
}

/**
 * Word-level diff of a changed line pair: highlight exactly the pieces that
 * differ. Returns the left/right segment lists. Falls back to "whole line
 * changed" if the word diff is somehow unsolvable.
 */
export function wordDiff(oldLine: string, newLine: string): { left: Segment[]; right: Segment[] } {
    const a = tokenizeWords(oldLine);
    const b = tokenizeWords(newLine);
    const ops = myers(a, b, (x, y) => x === y);

    if (!ops) {
        return {
            left: oldLine ? [{ text: oldLine, kind: 'changed' }] : [],
            right: newLine ? [{ text: newLine, kind: 'changed' }] : []
        };
    }

    const left: Segment[] = [];
    const right: Segment[] = [];
    for (const op of ops) {
        if (op.type === 'equal') {
            pushSegment(left, a[op.aIndex], 'same');
            pushSegment(right, b[op.bIndex], 'same');
        } else if (op.type === 'delete') {
            pushSegment(left, a[op.aIndex], 'changed');
        } else {
            pushSegment(right, b[op.bIndex], 'changed');
        }
    }
    return { left, right };
}

// --- Line-level diff -------------------------------------------------------

// Split text into lines, dropping a single trailing newline's phantom empty
// line (git-style: a trailing "\n" is line-termination, not an extra line).
function splitLines(text: string): string[] {
    if (text === '') return [];
    const lines = text.split('\n');
    if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    return lines;
}

const same = (text: string): Segment[] => (text ? [{ text, kind: 'same' as const }] : []);

// Coarse fallback used when Myers bails: everything on the left removed,
// everything on the right added, paired up as replaces where they overlap.
function trivialDiff(a: string[], b: string[]): DiffResult {
    return { ...buildRows(a.map((_, i) => ({ type: 'delete', aIndex: i }) as EditOp).concat(b.map((_, i) => ({ type: 'insert', bIndex: i }) as EditOp)), a, b), truncated: true };
}

// Turn a line-level edit script into aligned rows. A maximal block of deletes
// followed by inserts is paired index-wise into `replace` rows (with word-level
// highlighting); leftovers stay pure delete/insert.
function buildRows(ops: EditOp[], a: string[], b: string[]): DiffResult {
    const rows: Row[] = [];
    let added = 0;
    let removed = 0;
    let leftNum = 0;
    let rightNum = 0;

    let dels: number[] = []; // pending left line indices
    let inss: number[] = []; // pending right line indices

    const flush = () => {
        const paired = Math.min(dels.length, inss.length);
        for (let i = 0; i < paired; i++) {
            const oldText = a[dels[i]];
            const newText = b[inss[i]];
            const { left, right } = wordDiff(oldText, newText);
            rows.push({
                kind: 'replace',
                left: { num: ++leftNum, segments: left },
                right: { num: ++rightNum, segments: right }
            });
            added++;
            removed++;
        }
        for (let i = paired; i < dels.length; i++) {
            rows.push({ kind: 'delete', left: { num: ++leftNum, segments: same(a[dels[i]]) }, right: null });
            removed++;
        }
        for (let i = paired; i < inss.length; i++) {
            rows.push({ kind: 'insert', left: null, right: { num: ++rightNum, segments: same(b[inss[i]]) } });
            added++;
        }
        dels = [];
        inss = [];
    };

    for (const op of ops) {
        if (op.type === 'equal') {
            flush();
            leftNum++;
            rightNum++;
            rows.push({
                kind: 'equal',
                left: { num: leftNum, segments: same(a[op.aIndex]) },
                right: { num: rightNum, segments: same(b[op.bIndex]) }
            });
        } else if (op.type === 'delete') {
            dels.push(op.aIndex);
        } else {
            inss.push(op.bIndex);
        }
    }
    flush();

    return { rows, added, removed, truncated: false };
}

/** Diff two blocks of text line by line. Never throws. */
export function diffLines(oldText: string, newText: string): DiffResult {
    const a = splitLines(oldText);
    const b = splitLines(newText);
    const ops = myers(a, b, (x, y) => x === y);
    if (!ops) return trivialDiff(a, b);
    return buildRows(ops, a, b);
}

// --- Hunk folding ----------------------------------------------------------

// A shown block of rows, or a collapsed run of unchanged rows the user can
// expand. `key` is stable across identical inputs so the UI can track which
// folds are open without index drift.
export type Chunk =
    | { type: 'rows'; rows: Row[] }
    | { type: 'fold'; rows: Row[]; count: number; key: string };

/**
 * Collapse long runs of unchanged rows, keeping `context` rows of padding
 * around every change (GitHub/GitLab-style hunks). A run is only folded when
 * hiding it actually saves rows (run longer than 2·context, or an edge run
 * longer than context).
 */
export function foldRows(rows: Row[], context = 3): Chunk[] {
    const n = rows.length;
    if (n === 0) return [];

    // Mark every row within `context` of a change as visible.
    const visible = new Array<boolean>(n).fill(false);
    for (let i = 0; i < n; i++) {
        if (rows[i].kind !== 'equal') {
            for (let j = Math.max(0, i - context); j <= Math.min(n - 1, i + context); j++) {
                visible[j] = true;
            }
        }
    }

    const chunks: Chunk[] = [];
    let i = 0;
    while (i < n) {
        const start = i;
        const vis = visible[i];
        while (i < n && visible[i] === vis) i++;
        const slice = rows.slice(start, i);
        if (vis) {
            chunks.push({ type: 'rows', rows: slice });
        } else {
            const first = slice[0];
            const key = `${first.left?.num ?? 'x'}-${first.right?.num ?? 'x'}-${slice.length}`;
            chunks.push({ type: 'fold', rows: slice, count: slice.length, key });
        }
    }
    return chunks;
}

// --- Unified patch (for copy) ----------------------------------------------

const lineText = (line: Line | null): string => (line ? line.segments.map((s) => s.text).join('') : '');

/** Serialize a diff as a git-style unified patch, for the copy button. */
export function toUnifiedPatch(rows: Row[]): string {
    const out: string[] = [];
    for (const row of rows) {
        switch (row.kind) {
            case 'equal':
                out.push(' ' + lineText(row.left));
                break;
            case 'delete':
                out.push('-' + lineText(row.left));
                break;
            case 'insert':
                out.push('+' + lineText(row.right));
                break;
            case 'replace':
                out.push('-' + lineText(row.left));
                out.push('+' + lineText(row.right));
                break;
        }
    }
    return out.join('\n');
}
