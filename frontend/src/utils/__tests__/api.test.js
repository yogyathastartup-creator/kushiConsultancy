import { afterEach, describe, test, expect, vi } from 'vitest';
import { getApiUrl } from '../api';

afterEach(() => {
    vi.unstubAllEnvs();
});

describe('getApiUrl', () => {
    test('uses VITE_API_URL without a trailing slash', () => {
        vi.stubEnv('VITE_API_URL', 'https://api.example.com/api/');
        expect(getApiUrl()).toBe('https://api.example.com/api');
    });

    test('supports a relative /api base for the Netlify proxy', () => {
        vi.stubEnv('VITE_API_URL', '/api');
        expect(getApiUrl()).toBe('/api');
    });

    test('falls back to the local dev server when unset', () => {
        vi.stubEnv('VITE_API_URL', '');
        expect(getApiUrl()).toBe('http://localhost:3001/api');
    });
});
