/**
 * Levenshtein Distance (Dynamic Programming) Algorithm
 * Used to audit vault password reuse and detect similar/variant passwords.
 * Time Complexity: O(|S1| * |S2|)
 * Space Complexity: O(|S1| * |S2|)
 */

export class PasswordSimilarityAuditor {
  /**
   * Computes the Levenshtein edit distance matrix between two strings
   */
  calculateEditDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Create DP matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize boundary conditions
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill DP matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // Deletion
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Scans a dictionary of application password pairs to group similar passwords
   * Max similarity threshold (e.g., edit distance <= 3)
   */
  findSimilarPasswords(
    passwordsMap: Array<{ appName: string; password: string }>,
    maxDistanceThreshold: number = 3
  ): Array<{ appName: string; similarApps: Array<{ appName: string; editDistance: number }> }> {
    const results: Array<{ appName: string; similarApps: Array<{ appName: string; editDistance: number }> }> = [];

    for (let i = 0; i < passwordsMap.length; i++) {
      const target = passwordsMap[i];
      const similarApps: Array<{ appName: string; editDistance: number }> = [];

      for (let j = 0; j < passwordsMap.length; j++) {
        if (i === j) continue; // Skip comparing against self
        const compareWith = passwordsMap[j];

        const dist = this.calculateEditDistance(target.password, compareWith.password);
        if (dist <= maxDistanceThreshold) {
          similarApps.push({
            appName: compareWith.appName,
            editDistance: dist,
          });
        }
      }

      if (similarApps.length > 0) {
        results.push({
          appName: target.appName,
          similarApps,
        });
      }
    }

    return results;
  }
}
