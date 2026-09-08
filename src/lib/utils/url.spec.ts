import { describe, it, expect } from 'vitest';
import { encodeUrl, decodeUrl } from './url';

describe('url', () => {
	it('encodes reserved characters (& = ? /)', () => {
		expect(encodeUrl('a=1&b=2/c?')).toBe('a%3D1%26b%3D2%2Fc%3F');
	});

	it('round-trips arbitrary text', () => {
		const s = 'hello world & friends? café=☕';
		expect(decodeUrl(encodeUrl(s))).toBe(s);
	});

	it('throws on a malformed percent-sequence', () => {
		expect(() => decodeUrl('%')).toThrow();
	});
});
