// Authentication cache to reduce repeated checks
class AuthCache {
  private static cache = new Map<
    string,
    { isValid: boolean; timestamp: number }
  >();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static set(token: string, isValid: boolean): void {
    this.cache.set(token, {
      isValid,
      timestamp: Date.now(),
    });
  }

  static get(token: string): boolean | null {
    const cached = this.cache.get(token);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(token);
      return null;
    }

    return cached.isValid;
  }

  static clear(): void {
    this.cache.clear();
  }

  static clearExpired(): void {
    const now = Date.now();
    for (const [token, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(token);
      }
    }
  }
}

export default AuthCache;
