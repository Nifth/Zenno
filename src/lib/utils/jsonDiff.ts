// Structural JSON diff, built ON TOP of the text engine rather than beside it.
//
// The trick: parse both sides and re-serialize them canonically - object keys
// sorted, fixed 2-space indentation - then run the ordinary line diff. Two JSON
// documents that differ only by key ordering or whitespace canonicalize to the
// exact same text, so they show ZERO diff. That is what "structural" buys here,
// and it means folding, word-level highlighting, split/unified views and the
// unified-patch export all work identically to text mode for free.
//
// Trade-off (intentional, documented): arrays are compared positionally by the
// line diff - an element inserted at the front shows as an insert, not a cascade
// of "changed" rows, which is usually what you want. Object key order is
// discarded by design. One artifact of line-based JSON diffing: appending a key
// adds a trailing comma to the previous line, so that line reads as changed too
// (word-level highlighting narrows it to just the comma). git behaves the same.

import { diffLines, type DiffResult } from './diff';
import { describeJsonError, type JsonError } from './json';

// Recursively sort object keys so serialization is order-independent. Arrays
// keep their order (order is semantically meaningful in arrays).
function sortKeys(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(sortKeys);
    if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const key of Object.keys(value as Record<string, unknown>).sort()) {
            out[key] = sortKeys((value as Record<string, unknown>)[key]);
        }
        return out;
    }
    return value;
}

/** Parse + canonicalize one document. Throws on invalid JSON (caller handles). */
export function canonicalize(input: string): string {
    return JSON.stringify(sortKeys(JSON.parse(input)), null, 2);
}

// Which side failed to parse, plus the located error, so the UI can point at
// the offending pane.
export interface JsonDiffError extends JsonError {
    side: 'left' | 'right';
}

export interface JsonDiffResult {
    result: DiffResult | null; // null when either side is invalid
    error: JsonDiffError | null;
}

/**
 * Diff two JSON documents structurally. Returns a parse error (with side) if
 * either input is not valid JSON; otherwise a normal DiffResult over the
 * canonical forms.
 */
export function diffJson(oldText: string, newText: string): JsonDiffResult {
    let left: string;
    let right: string;

    try {
        left = canonicalize(oldText);
    } catch (e) {
        return { result: null, error: { side: 'left', ...describeJsonError(oldText, e) } };
    }
    try {
        right = canonicalize(newText);
    } catch (e) {
        return { result: null, error: { side: 'right', ...describeJsonError(newText, e) } };
    }

    return { result: diffLines(left, right), error: null };
}
