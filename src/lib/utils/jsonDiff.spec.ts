import { describe, it, expect } from 'vitest';
import { canonicalize, diffJson } from './jsonDiff';

describe('canonicalize', () => {
    it('sorts object keys deeply', () => {
        expect(canonicalize('{"b":1,"a":{"d":2,"c":3}}')).toBe(
            '{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}'
        );
    });

    it('preserves array order', () => {
        expect(canonicalize('[3,1,2]')).toBe('[\n  3,\n  1,\n  2\n]');
    });
});

describe('diffJson', () => {
    it('reports no change when only key order and whitespace differ', () => {
        const { result, error } = diffJson('{"a":1,   "b":2}', '{\n"b": 2,\n"a": 1\n}');
        expect(error).toBeNull();
        expect(result!.added).toBe(0);
        expect(result!.removed).toBe(0);
    });

    it('detects a changed scalar value', () => {
        const { result } = diffJson('{"port":8080}', '{"port":9090}');
        expect(result!.added).toBe(1);
        expect(result!.removed).toBe(1);
        expect(result!.rows.some((r) => r.kind === 'replace')).toBe(true);
    });

    it('detects an added key', () => {
        const { result } = diffJson('{"a":1}', '{"a":1,"b":2}');
        // Line-based diff of pretty JSON: appending a key also adds a trailing
        // comma to the previous line, so "a" is a replace and "b" an insert.
        // (git diffs pretty JSON the same way.) The new key line still appears.
        const insertsB = result!.rows.some(
            (r) => r.kind === 'insert' && r.right!.segments.map((s) => s.text).join('').includes('"b"')
        );
        expect(insertsB).toBe(true);
        expect(result!.added).toBe(2);
        expect(result!.removed).toBe(1);
    });

    it('flags the left side as invalid with a location', () => {
        const { result, error } = diffJson('{bad', '{}');
        expect(result).toBeNull();
        expect(error!.side).toBe('left');
        expect(error!.line).toBe(1);
    });

    it('flags the right side as invalid', () => {
        const { error } = diffJson('{}', '{"a":}');
        expect(error!.side).toBe('right');
    });
});
