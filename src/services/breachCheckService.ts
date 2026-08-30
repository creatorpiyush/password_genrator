/**
 * Dark Web Breach Monitoring API Service using HaveIBeenPwned k-Anonymity Model.
 *
 * Privacy Guarantee:
 * The password is SHA-1 hashed locally. Only the FIRST 5 characters of the SHA-1 hash
 * are sent over the network. The full password or full hash is NEVER transmitted.
 */

export interface BreachCheckResult {
  isBreached: boolean;
  breachCount: number;
  prefix: string;
}

/**
 * Compute SHA-1 hash of a string using WebCrypto API
 */
export async function computeSHA1(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buffer = enc.encode(text);
  const digest = await crypto.subtle.digest('SHA-1', buffer);
  const hashArray = Array.from(new Uint8Array(digest));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Check HaveIBeenPwned database via k-Anonymity 5-char hash prefix lookup
 */
export async function checkPasswordBreach(password: string): Promise<BreachCheckResult> {
  if (!password) {
    return { isBreached: false, breachCount: 0, prefix: '' };
  }

  const sha1Hash = await computeSHA1(password);
  const prefix = sha1Hash.substring(0, 5);
  const suffix = sha1Hash.substring(5);

  let responseText = '';

  try {
    // 1. Attempt direct request to HaveIBeenPwned Range API
    const directRes = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' } // Extra privacy padding
    });
    if (directRes.ok) {
      responseText = await directRes.text();
    } else {
      throw new Error(`HIBP Direct HTTP ${directRes.status}`);
    }
  } catch (directErr) {
    // 2. Fallback to Express proxy route to resolve CORS in development
    try {
      const proxyRes = await fetch(`/api/v1/breach/check-prefix/${prefix}`);
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        responseText = data.rangeData || '';
      } else {
        throw new Error('Proxy failed');
      }
    } catch (proxyErr) {
      console.warn('⚠️ Breach check offline:', proxyErr);
      return { isBreached: false, breachCount: 0, prefix };
    }
  }

  // Parse returned suffixes "SUFFIX:COUNT"
  const lines = responseText.split('\n');
  for (const line of lines) {
    const [lineSuffix, countStr] = line.trim().split(':');
    if (lineSuffix && lineSuffix.toUpperCase() === suffix.toUpperCase()) {
      const breachCount = parseInt(countStr, 10) || 0;
      return {
        isBreached: breachCount > 0,
        breachCount,
        prefix,
      };
    }
  }

  return { isBreached: false, breachCount: 0, prefix };
}
