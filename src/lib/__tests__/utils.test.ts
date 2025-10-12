import { describe, it, expect } from 'vitest';
import { normalizeEmail, normalizePhoneAU } from '../utils';

describe('normalizeEmail', () => {
  it('should lowercase and trim emails', () => {
    // TODO: Implement comprehensive test cases
    expect(normalizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    expect(normalizeEmail('Test@Email.com')).toBe('test@email.com');
    expect(normalizeEmail('UPPERCASE@DOMAIN.COM')).toBe('uppercase@domain.com');
  });
  
  it('should handle already normalized emails', () => {
    // TODO: Implement test case
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });
});

describe('normalizePhoneAU', () => {
  it('should normalize AU phone formats to E.164', () => {
    // TODO: Implement comprehensive test cases
    expect(normalizePhoneAU('0466310826')).toBe('+61466310826');
    expect(normalizePhoneAU('466310826')).toBe('+61466310826');
    expect(normalizePhoneAU('+61466310826')).toBe('+61466310826');
    expect(normalizePhoneAU('61466310826')).toBe('+61466310826');
  });
  
  it('should handle phone with spaces and formatting', () => {
    // TODO: Implement test cases
    expect(normalizePhoneAU('0466 310 826')).toBe('+61466310826');
    expect(normalizePhoneAU('+61 466 310 826')).toBe('+61466310826');
  });
  
  it('should throw on invalid formats', () => {
    // TODO: Implement test cases for invalid inputs
    expect(() => normalizePhoneAU('123')).toThrow('Invalid AU phone number format');
    expect(() => normalizePhoneAU('12345678901234')).toThrow();
    expect(() => normalizePhoneAU('')).toThrow();
  });
  
  it('should validate correct length after normalization', () => {
    // TODO: Test edge cases
    // AU numbers should be 11 digits total (61 + 9)
  });
});

