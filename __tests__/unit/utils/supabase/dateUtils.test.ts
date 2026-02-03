import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getToday,
  getYesterday,
  getDaysAgo,
  getWeekStart,
  getMonthStart,
  getMonthsAgo,
  getDateRange,
  getDayRange,
} from '@/utils/supabase/supabase';

// Date format regex: YYYY-MM-DD
const DATE_FORMAT_REGEX = /^\d{4}-\d{2}-\d{2}$/;

describe('Date Utility Functions', () => {
  describe('getToday', () => {
    it('should return a valid date format (YYYY-MM-DD)', () => {
      const today = getToday();
      expect(today).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return current date', () => {
      const today = getToday();
      const now = new Date();
      const year = now.getFullYear();
      // At minimum, the year should match
      expect(today).toContain(year.toString());
    });
  });

  describe('getYesterday', () => {
    it('should return a valid date format', () => {
      const yesterday = getYesterday();
      expect(yesterday).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return the day before today', () => {
      const today = new Date(getToday());
      const yesterday = new Date(getYesterday());
      const diffDays =
        (today.getTime() - yesterday.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(1);
    });
  });

  describe('getDaysAgo', () => {
    it('should return a valid date format', () => {
      const daysAgo = getDaysAgo(7);
      expect(daysAgo).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return correct date for 0 days ago (today)', () => {
      const zeroDaysAgo = getDaysAgo(0);
      const today = getToday();
      expect(zeroDaysAgo).toBe(today);
    });

    it('should return correct date for 7 days ago', () => {
      const today = new Date(getToday());
      const weekAgo = new Date(getDaysAgo(7));
      const diffDays =
        (today.getTime() - weekAgo.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(7);
    });

    it('should handle large numbers of days', () => {
      const daysAgo = getDaysAgo(365);
      expect(daysAgo).toMatch(DATE_FORMAT_REGEX);
    });
  });

  describe('getWeekStart', () => {
    it('should return a valid date format', () => {
      const weekStart = getWeekStart();
      expect(weekStart).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return a Monday', () => {
      const weekStart = new Date(getWeekStart());
      // Monday is day 1 in JS (0 = Sunday)
      expect(weekStart.getDay()).toBe(1);
    });
  });

  describe('getMonthStart', () => {
    it('should return a valid date format', () => {
      const monthStart = getMonthStart();
      expect(monthStart).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return the first day of the month', () => {
      const monthStart = getMonthStart();
      expect(monthStart).toMatch(/-01$/);
    });
  });

  describe('getMonthsAgo', () => {
    it('should return a valid date format', () => {
      const monthsAgo = getMonthsAgo(3);
      expect(monthsAgo).toMatch(DATE_FORMAT_REGEX);
    });

    it('should return 0 months ago as approximately today', () => {
      const zeroMonthsAgo = getMonthsAgo(0);
      const today = getToday();
      // Same month and year
      expect(zeroMonthsAgo.substring(0, 7)).toBe(today.substring(0, 7));
    });
  });

  describe('getDateRange', () => {
    it('should return start and end timestamps', () => {
      const range = getDateRange('2025-01-01', '2025-01-31');
      expect(range.start).toBe('2025-01-01T00:00:00');
      expect(range.end).toBe('2025-01-31T23:59:59');
    });

    it('should handle same start and end date', () => {
      const range = getDateRange('2025-06-15', '2025-06-15');
      expect(range.start).toBe('2025-06-15T00:00:00');
      expect(range.end).toBe('2025-06-15T23:59:59');
    });
  });

  describe('getDayRange', () => {
    it('should return full day range for single date', () => {
      const range = getDayRange('2025-03-20');
      expect(range.start).toBe('2025-03-20T00:00:00');
      expect(range.end).toBe('2025-03-20T23:59:59');
    });
  });
});
