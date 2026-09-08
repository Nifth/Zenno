import { describe, it, expect } from 'vitest';
import { parseJwt } from './jwt';

// Canonical jwt.io sample token (HS256).
const SAMPLE =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
	'.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ' +
	'.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const b64url = (obj: unknown) => {
	const bytes = new TextEncoder().encode(JSON.stringify(obj));
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

describe('parseJwt', () => {
	it('decodes header, payload and signature', () => {
		const { header, payload, signature } = parseJwt(SAMPLE);
		expect(header).toEqual({ alg: 'HS256', typ: 'JWT' });
		expect(payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
		expect(signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
	});

	it('trims surrounding whitespace', () => {
		expect(parseJwt(`  ${SAMPLE}  `).header).toEqual({ alg: 'HS256', typ: 'JWT' });
	});

	it('decodes UTF-8 payload content', () => {
		const token = `${b64url({ alg: 'none' })}.${b64url({ name: 'Café ☕ 日本' })}`;
		expect(parseJwt(token).payload).toEqual({ name: 'Café ☕ 日本' });
	});

	it('leaves signature undefined when absent', () => {
		const token = `${b64url({ alg: 'none' })}.${b64url({ sub: '1' })}`;
		expect(parseJwt(token).signature).toBeUndefined();
	});

	it('throws when the token has fewer than 2 parts', () => {
		expect(() => parseJwt('not-a-jwt')).toThrow(/at least 2 dots/);
	});
});
