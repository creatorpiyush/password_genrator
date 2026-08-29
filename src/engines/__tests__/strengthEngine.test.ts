import { describe, it, expect, beforeEach } from 'vitest';
import { PasswordStrengthEngine } from '../strengthEngine';

describe('PasswordStrengthEngine', () => {
  let engine: PasswordStrengthEngine;

  beforeEach(() => {
    engine = new PasswordStrengthEngine();
  });

  it('should flag short and weak passwords like "Test" as Very Weak', () => {
    const report = engine.evaluate('Test');
    expect(report.label).toBe('Very Weak');
    expect(report.score).toBeLessThan(40);
    expect(report.issues.length).toBeGreaterThan(0);
  });

  it('should flag keyboard walks like "qwerty12345" as Weak', () => {
    const report = engine.evaluate('qwerty12345');
    expect(report.score).toBeLessThanOrEqual(50);
    expect(report.issues.some(i => i.includes('keyboard walk') || i.includes('pattern'))).toBe(true);
  });

  it('should rate complex high-entropy passwords as Very Strong', () => {
    const report = engine.evaluate('K9#mvL2$pQ8@zM1!4729');
    expect(report.label).toBe('Very Strong');
    expect(report.score).toBeGreaterThanOrEqual(85);
    expect(report.issues).toHaveLength(0);
  });
});
