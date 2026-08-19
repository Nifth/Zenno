function decodeBase64Url(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    
    return decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
}

export function parseJwt(jwtToken: string) {
    const parts = jwtToken.trim().split('.');
    
    if (parts.length < 2) {
        throw new Error('Invalid JWT: Token must contain at least 2 dots');
    }

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

    return { header, payload, signature: parts[2] };
}