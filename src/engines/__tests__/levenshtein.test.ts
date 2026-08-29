import { describe, it, expect } from 'vitest';
import { PasswordSimilarityAuditor } from '../levenshtein';

describe('PasswordSimilarityAuditor (Levenshtein DP Matrix)', () => {
  const auditor = new PasswordSimilarityAuditor();

  it('should return 0 for identical strings', () => {
    expect(auditor.calculateEditDistance('Pass123!', 'Pass123!')).toBe(0);
  });

  it('should calculate correct edit distance for substitutions, insertions, deletions', () => {
    expect(auditor.calculateEditDistance('Password123!', 'Password1234!')).toBe(1);
    expect(auditor.calculateEditDistance('cat', 'hat')).toBe(1);
    expect(auditor.calculateEditDistance('kitten', 'sitting')).toBe(3);
  });

  it('should cluster similar passwords across vault entries', () => {
    const vault = [
      { appName: 'GitHub', password: 'Password123!' },
      { appName: 'GitLab', password: 'Password1234!' },
      { appName: 'Banking', password: 'xK9#vL2$pQ8@zM1!' },
    ];

    const clusters = auditor.findSimilarPasswords(vault, 3);
    expect(clusters).toHaveLength(2); // GitHub and GitLab flag each other
    expect(clusters[0].appName).toBe('GitHub');
    expect(clusters[0].similarApps[0].appName).toBe('GitLab');
  });
});
