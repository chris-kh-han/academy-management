import { describe, it, expect } from 'vitest';
import { formatCurrency, formatShortDate, formatDate } from '@/lib/format';

describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    const result = formatCurrency(1000);
    expect(result).toContain('1,000');
    expect(result).toContain('₩');
  });

  it('should format zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
  });

  it('should format negative numbers', () => {
    const result = formatCurrency(-5000);
    expect(result).toContain('5,000');
    expect(result).toContain('-');
  });

  it('should format large numbers with commas', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1,000,000');
  });

  it('should handle NaN by returning 0', () => {
    const result = formatCurrency(NaN);
    expect(result).toContain('0');
  });

  it('should handle Infinity by returning 0', () => {
    const result = formatCurrency(Infinity);
    expect(result).toContain('0');
  });
});

describe('formatShortDate', () => {
  it('should format valid date string', () => {
    const result = formatShortDate('2025-01-15');
    expect(result).toBe('1. 15.');
  });

  it('should format ISO date string', () => {
    const result = formatShortDate('2025-12-25T10:30:00Z');
    // Korean format: 12. 25.
    expect(result).toMatch(/12\.\s*25\./);
  });

  it('should return "-" for invalid date', () => {
    expect(formatShortDate('invalid-date')).toBe('-');
    expect(formatShortDate('')).toBe('-');
    expect(formatShortDate('not-a-date')).toBe('-');
  });
});

describe('formatDate', () => {
  it('should format valid date string to Korean format', () => {
    const result = formatDate('2025-01-15');
    // Korean format: 2025. 1. 15.
    expect(result).toMatch(/2025\.\s*1\.\s*15\./);
  });

  it('should format ISO date string', () => {
    const result = formatDate('2025-06-30T15:00:00Z');
    expect(result).toMatch(/2025/);
    expect(result).toMatch(/6|7/); // Could be 6 or 7 depending on timezone
  });

  it('should return "-" for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('-');
    expect(formatDate('')).toBe('-');
    expect(formatDate('abc')).toBe('-');
  });
});
