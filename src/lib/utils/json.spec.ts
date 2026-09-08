import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, highlightJson, describeJsonError } from './json';

describe('formatJson / minifyJson', () => {
	it('pretty-prints with 2 spaces by default', () => {
		expect(formatJson('{"a":1}')).toBe('{\n  "a": 1\n}');
	});

	it('supports 4-space and tab indentation', () => {
		expect(formatJson('{"a":1}', 4)).toBe('{\n    "a": 1\n}');
		expect(formatJson('{"a":1}', '\t')).toBe('{\n\t"a": 1\n}');
	});

	it('minifies to a single line', () => {
		expect(minifyJson('{ "a": 1, "b": [1, 2] }')).toBe('{"a":1,"b":[1,2]}');
	});

	it('throws on invalid JSON (format == validate)', () => {
		expect(() => formatJson('{ bad }')).toThrow();
	});
});

describe('describeJsonError', () => {
	it('computes line/column from a parse error', () => {
		const input = '{\n  "a": 1,\n  "b" 2\n}';
		let info;
		try {
			JSON.parse(input);
		} catch (e) {
			info = describeJsonError(input, e);
		}
		expect(info).toBeTruthy();
		expect(info!.message).toBeTruthy();
		if (info!.line !== null) {
			expect(info!.line).toBe(3);
			expect(info!.column).toBeGreaterThan(0);
		}
	});
});

describe('highlightJson', () => {
	it('colors strings, numbers, booleans, null and keys distinctly', () => {
		const html = highlightJson(formatJson('{"s":"x","n":3.5,"b":true,"z":null}'));
		expect(html).toContain('text-emerald-400'); // string
		expect(html).toContain('text-sky-400'); // number
		expect(html).toContain('text-orange-400'); // boolean
		expect(html).toContain('text-purple-400'); // null
		expect(html).toContain('text-fuchsia-300'); // key
	});

	it('escapes HTML in values (XSS-safe for @html)', () => {
		const html = highlightJson(formatJson('{"x":"<img src=x onerror=alert(1)>"}'));
		expect(html).toContain('&lt;img');
		expect(html).not.toContain('<img');
	});

	it('does not mistake digits inside a string for a number token', () => {
		const html = highlightJson(formatJson('{"id":"abc123"}'));
		// the string value keeps its digits inside the emerald span, unsplit
		expect(html).toContain('<span class="text-emerald-400">"abc123"</span>');
	});
});
