import { describe, it, expect } from 'vitest';
import { runRegex, highlightMatches } from './regex';

describe('runRegex', () => {
	it('finds all matches with the g flag', () => {
		const r = runRegex('a', 'g', 'banana');
		expect(r.matches.map((m) => m.index)).toEqual([1, 3, 5]);
		expect(r.error).toBeNull();
	});

	it('returns only the first match without g', () => {
		const r = runRegex('a', '', 'banana');
		expect(r.matches).toHaveLength(1);
		expect(r.matches[0].index).toBe(1);
	});

	it('exposes numbered capture groups', () => {
		const r = runRegex('(\\d+)-(\\d+)', '', '12-34');
		expect(r.matches[0].groups).toEqual(['12', '34']);
	});

	it('exposes named capture groups', () => {
		const r = runRegex('(?<year>\\d{4})', '', 'y2024');
		expect(r.matches[0].namedGroups).toEqual({ year: '2024' });
	});

	it('reports invalid patterns instead of throwing', () => {
		const r = runRegex('(', 'g', 'abc');
		expect(r.error).toBeTruthy();
		expect(r.matches).toHaveLength(0);
	});

	it('honors the i flag', () => {
		expect(runRegex('ABC', 'gi', 'abcABC').matches).toHaveLength(2);
	});

	it('terminates on zero-length global matches', () => {
		const r = runRegex('a*', 'g', 'aXa');
		// must return a finite result, not hang
		expect(r.matches.length).toBeGreaterThan(0);
		expect(Number.isFinite(r.matches.length)).toBe(true);
	});
});

describe('highlightMatches', () => {
	it('wraps matches and escapes HTML (XSS-safe for @html)', () => {
		const text = '<b>hit</b>';
		const { matches } = runRegex('hit', 'g', text);
		const html = highlightMatches(text, matches);
		expect(html).toContain('&lt;b&gt;');
		expect(html).not.toContain('<b>');
		expect(html).toMatch(/<span class="bg-(fuchsia|purple)-500\/30[^"]*">hit<\/span>/);
	});

	it('alternates highlight styles for adjacent matches', () => {
		const { matches } = runRegex('a', 'g', 'aaa');
		const html = highlightMatches('aaa', matches);
		expect(html).toContain('bg-fuchsia-500/30');
		expect(html).toContain('bg-purple-500/30');
	});

	it('returns escaped plain text when there are no matches', () => {
		expect(highlightMatches('a & <b>', [])).toBe('a &amp; &lt;b&gt;');
	});
});
