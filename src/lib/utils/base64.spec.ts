import { describe, it, expect } from 'vitest';
import { encodeBase64, decodeBase64 } from './base64';

describe('base64', () => {
	it('encodes ASCII', () => {
		expect(encodeBase64('hello')).toBe('aGVsbG8=');
	});

	it('decodes ASCII', () => {
		expect(decodeBase64('aGVsbG8=')).toBe('hello');
	});

	it('round-trips UTF-8 / emoji (regression: btoa throws on these)', () => {
		const samples = ['héllo', 'café ☕', '日本語', '👋🌍'];
		for (const s of samples) {
			expect(decodeBase64(encodeBase64(s))).toBe(s);
		}
	});

	it('encodes non-Latin1 without throwing', () => {
		expect(() => encodeBase64('é')).not.toThrow();
	});

	it('throws on invalid base64 input', () => {
		expect(() => decodeBase64('###not-base64###')).toThrow();
	});
});
