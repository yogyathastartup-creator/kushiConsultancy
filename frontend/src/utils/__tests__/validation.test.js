import { describe, test, expect } from 'vitest';
import {
    sanitizeInput,
    validateEmail,
    validatePhone,
    validateFile,
    validateTextInput,
    sanitizeFormData
} from '../validation';

describe('sanitizeInput', () => {
    test('strips HTML tags and event handlers', () => {
        expect(sanitizeInput('<b>Asha</b> <img src=x onerror=alert(1)>')).toBe('Asha');
        expect(sanitizeInput('javascript:alert(1)')).toBe('alert(1)');
    });

    test('collapses whitespace and trims', () => {
        expect(sanitizeInput('  Asha   Kumar  ')).toBe('Asha Kumar');
    });

    test('returns non-strings unchanged', () => {
        expect(sanitizeInput(42)).toBe(42);
    });
});

describe('validateEmail', () => {
    test.each([
        ['asha@example.com', true],
        ['asha.kumar+cv@kushiconsultancy.com', true],
        ['not-an-email', false],
        ['', false],
        [null, false]
    ])('%s -> %s', (input, expected) => {
        expect(validateEmail(input)).toBe(expected);
    });
});

describe('validatePhone', () => {
    test.each([
        ['+919361970260', true],
        ['9361970260', true],
        ['+971501234567', true],
        ['12', false],
        ['abc', false]
    ])('%s -> %s', (input, expected) => {
        expect(validatePhone(input)).toBe(expected);
    });
});

describe('validateFile', () => {
    const makeFile = (name, type, size = 1024) => ({ name, type, size });

    test('accepts PDF, DOC and DOCX', () => {
        expect(validateFile(makeFile('cv.pdf', 'application/pdf')).valid).toBe(true);
        expect(validateFile(makeFile('cv.doc', 'application/msword')).valid).toBe(true);
        expect(validateFile(makeFile('cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')).valid).toBe(true);
    });

    test('rejects other types, oversize files and path tricks', () => {
        expect(validateFile(null).valid).toBe(false);
        expect(validateFile(makeFile('cv.exe', 'application/x-msdownload')).valid).toBe(false);
        expect(validateFile(makeFile('cv.pdf', 'application/pdf', 5 * 1024 * 1024 + 1)).valid).toBe(false);
        expect(validateFile(makeFile('../cv.pdf', 'application/pdf')).valid).toBe(false);
    });
});

describe('validateTextInput', () => {
    test('enforces length bounds', () => {
        expect(validateTextInput('ab', 2, 5).valid).toBe(true);
        expect(validateTextInput('a', 2, 5).valid).toBe(false);
        expect(validateTextInput('abcdef', 2, 5).valid).toBe(false);
        expect(validateTextInput('', 1).valid).toBe(false);
    });
});

describe('sanitizeFormData', () => {
    test('sanitizes every string field', () => {
        expect(sanitizeFormData({ name: ' <i>Asha</i> ', age: 30 })).toEqual({ name: 'Asha', age: 30 });
    });
});
