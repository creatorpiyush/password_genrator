/**
 * Comprehensive Algorithmic & Heuristic Password Strength Engine
 * Combines Shannon Entropy, Keyboard Walk Detection, Character Set Diversity,
 * Repetitive Pattern Analysis, and Bloom Filter Breach Lookup.
 */

import { PasswordBloomFilter } from './bloomFilter';
import { PasswordGenerator } from './generator';

export interface PasswordAuditReport {
  score: number; // 0 to 100
  label: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong';
  entropyBits: number;
  isBreachedOrCommon: boolean;
  issues: string[];
  suggestions: string[];
}

const KEYBOARD_PATTERNS = [
  'qwerty', 'qwertyuiop', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm',
  '12345', '123456', '123456789', '987654321', '111111', '000000',
  'abcdef', 'password', 'admin', 'welcome', 'testing'
];

export class PasswordStrengthEngine {
  private bloomFilter: PasswordBloomFilter;

  constructor(bloomFilter?: PasswordBloomFilter) {
    this.bloomFilter = bloomFilter || new PasswordBloomFilter();
  }

  evaluate(password: string): PasswordAuditReport {
    if (!password) {
      return {
        score: 0,
        label: 'Very Weak',
        entropyBits: 0,
        isBreachedOrCommon: false,
        issues: ['Password cannot be empty.'],
        suggestions: ['Enter a secure password or generate one using CSPRNG.'],
      };
    }

    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    const length = password.length;
    const entropy = PasswordGenerator.calculateEntropy(password);
    const normalized = password.toLowerCase();

    // 1. Length Check
    if (length < 8) {
      score -= 45;
      issues.push(`Critically short length (${length} characters). Minimum recommended is 12+ characters.`);
      suggestions.push('Increase length to at least 12–16 characters.');
    } else if (length < 12) {
      score -= 15;
      issues.push(`Moderate length (${length} characters).`);
      suggestions.push('Consider expanding to 14+ characters for higher security.');
    }

    // 2. Entropy Check
    if (entropy < 35) {
      score -= 30;
      issues.push(`Very low information entropy (${entropy} bits). Easily breakable via brute force.`);
    } else if (entropy < 55) {
      score -= 15;
      issues.push(`Moderate entropy (${entropy} bits).`);
    }

    // 3. Bloom Filter & Dictionary Check
    const isBreached = this.bloomFilter.mightContain(password);
    if (isBreached) {
      score -= 50;
      issues.push('Matches a known weak or leaked password pattern in the breach database.');
      suggestions.push('Never use common dictionary words or default passwords.');
    }

    // 4. Keyboard Walk & Sequential Patterns
    for (const pattern of KEYBOARD_PATTERNS) {
      if (normalized.includes(pattern)) {
        score -= 25;
        issues.push(`Contains predictable keyboard walk or pattern ('${pattern}').`);
        suggestions.push('Avoid sequential keyboard runs (e.g. qwerty, 12345).');
        break;
      }
    }

    // 5. Character Set Diversity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^a-zA-Z0-9]/.test(password);

    const typesCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    if (typesCount === 1) {
      score -= 25;
      issues.push('Uses only a single character set type (e.g. lowercase only or numbers only).');
      suggestions.push('Mix uppercase letters, lowercase letters, numbers, and symbols.');
    } else if (typesCount === 2) {
      score -= 10;
      issues.push('Limited character diversity.');
    }

    // 6. Repetitive Characters Check (e.g., 'aaaa', '1111')
    if (/(.)\1{3,}/.test(password)) {
      score -= 20;
      issues.push('Contains 4+ repeated consecutive characters.');
      suggestions.push('Avoid repeating identical characters.');
    }

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let label: PasswordAuditReport['label'] = 'Very Weak';
    if (finalScore >= 85) label = 'Very Strong';
    else if (finalScore >= 70) label = 'Strong';
    else if (finalScore >= 50) label = 'Moderate';
    else if (finalScore >= 30) label = 'Weak';

    return {
      score: finalScore,
      label,
      entropyBits: entropy,
      isBreachedOrCommon: isBreached,
      issues,
      suggestions,
    };
  }
}
