import { describe, it, expect } from 'vitest';
import { myers, diffLines, wordDiff, foldRows, toUnifiedPatch, type Row } from './diff';

const text = (line: { segments: { text: string }[] } | null) =>
    line ? line.segments.map((s) => s.text).join('') : null;

describe('myers', () => {
    it('returns all-equal ops for identical arrays', () => {
        const ops = myers(['a', 'b', 'c'], ['a', 'b', 'c'], (x, y) => x === y);
        expect(ops).toEqual([
            { type: 'equal', aIndex: 0, bIndex: 0 },
            { type: 'equal', aIndex: 1, bIndex: 1 },
            { type: 'equal', aIndex: 2, bIndex: 2 }
        ]);
    });

    it('finds the minimal edit script (classic ABCABBA / CBABAC)', () => {
        const a = 'ABCABBA'.split('');
        const b = 'CBABAC'.split('');
        const ops = myers(a, b, (x, y) => x === y)!;
        const dels = ops.filter((o) => o.type === 'delete').length;
        const inss = ops.filter((o) => o.type === 'insert').length;
        // Myers' own worked example: edit distance 5 (3 deletes + 2 inserts).
        expect(dels + inss).toBe(5);
    });

    it('handles empty inputs', () => {
        expect(myers([], [], (x, y) => x === y)).toEqual([]);
        expect(myers(['a'], [], (x, y) => x === y)).toEqual([{ type: 'delete', aIndex: 0 }]);
        expect(myers([], ['a'], (x, y) => x === y)).toEqual([{ type: 'insert', bIndex: 0 }]);
    });

    it('reconstructs both sides from the edit script', () => {
        const a = 'the quick brown fox'.split('');
        const b = 'the slow brown cat'.split('');
        const ops = myers(a, b, (x, y) => x === y)!;
        const outA = ops.filter((o) => o.type !== 'insert').map((o: any) => a[o.aIndex]).join('');
        const outB = ops.filter((o) => o.type !== 'delete').map((o: any) => b[o.bIndex]).join('');
        expect(outA).toBe('the quick brown fox');
        expect(outB).toBe('the slow brown cat');
    });
});

describe('diffLines', () => {
    it('marks identical text as all equal', () => {
        const r = diffLines('a\nb\nc', 'a\nb\nc');
        expect(r.rows.every((row) => row.kind === 'equal')).toBe(true);
        expect(r.added).toBe(0);
        expect(r.removed).toBe(0);
    });

    it('detects a pure insertion', () => {
        const r = diffLines('a\nc', 'a\nb\nc');
        expect(r.added).toBe(1);
        expect(r.removed).toBe(0);
        const ins = r.rows.find((row) => row.kind === 'insert')!;
        expect(text(ins.right)).toBe('b');
        expect(ins.left).toBeNull();
    });

    it('detects a pure deletion', () => {
        const r = diffLines('a\nb\nc', 'a\nc');
        expect(r.removed).toBe(1);
        expect(r.added).toBe(0);
        const del = r.rows.find((row) => row.kind === 'delete')!;
        expect(text(del.left)).toBe('b');
        expect(del.right).toBeNull();
    });

    it('pairs a changed line into a replace row', () => {
        const r = diffLines('hello world', 'hello there');
        expect(r.rows).toHaveLength(1);
        expect(r.rows[0].kind).toBe('replace');
        expect(r.added).toBe(1);
        expect(r.removed).toBe(1);
    });

    it('numbers lines independently per side', () => {
        const r = diffLines('a\nb\nc', 'a\nx\nb\nc');
        const eqC = r.rows.filter((row) => row.kind === 'equal').map((row) => [row.left!.num, row.right!.num]);
        // 'a' aligns 1<=>1, 'b' 2<=>3, 'c' 3<=>4
        expect(eqC).toEqual([
            [1, 1],
            [2, 3],
            [3, 4]
        ]);
    });

    it('ignores a single trailing newline', () => {
        const r = diffLines('a\nb\n', 'a\nb');
        expect(r.added).toBe(0);
        expect(r.removed).toBe(0);
    });
});

describe('wordDiff', () => {
    it('highlights only the changed words', () => {
        const { left, right } = wordDiff('the quick brown fox', 'the slow brown fox');
        expect(left.filter((s) => s.kind === 'changed').map((s) => s.text)).toEqual(['quick']);
        expect(right.filter((s) => s.kind === 'changed').map((s) => s.text)).toEqual(['slow']);
    });

    it('segments re-concatenate to the original lines', () => {
        const { left, right } = wordDiff('port: 8080,', 'port: 9090,');
        expect(left.map((s) => s.text).join('')).toBe('port: 8080,');
        expect(right.map((s) => s.text).join('')).toBe('port: 9090,');
    });
});

describe('foldRows', () => {
    const eq = (n: number): Row =>
        ({ kind: 'equal', left: { num: n, segments: [{ text: 'x', kind: 'same' }] }, right: { num: n, segments: [{ text: 'x', kind: 'same' }] } });
    const change = (): Row =>
        ({ kind: 'insert', left: null, right: { num: 0, segments: [{ text: '+', kind: 'same' }] } });

    it('folds a long unchanged run, keeping context on both edges', () => {
        const rows = [...Array(10)].map((_, i) => eq(i + 1));
        rows[5] = change();
        const chunks = foldRows(rows, 3);
        // rows 0..1 folded (before context), 2..8 shown (change±3), 9 alone folded
        const folds = chunks.filter((c) => c.type === 'fold');
        expect(folds.length).toBe(2);
        const shown = chunks.filter((c) => c.type === 'rows').flatMap((c) => c.rows);
        expect(shown).toContain(rows[5]);
    });

    it('does not fold when everything is close to a change', () => {
        const rows = [eq(1), change(), eq(2)];
        const chunks = foldRows(rows, 3);
        expect(chunks.every((c) => c.type === 'rows')).toBe(true);
    });

    it('folded rows are preserved so they can be expanded', () => {
        const rows = [...Array(20)].map((_, i) => eq(i + 1));
        rows[10] = change();
        const chunks = foldRows(rows, 3);
        const total = chunks.reduce((n, c) => n + c.rows.length, 0);
        expect(total).toBe(20);
    });
});

describe('toUnifiedPatch', () => {
    it('emits a git-style unified body', () => {
        const r = diffLines('a\nold\nc', 'a\nnew\nc');
        const patch = toUnifiedPatch(r.rows);
        expect(patch).toBe(' a\n-old\n+new\n c');
    });
});
