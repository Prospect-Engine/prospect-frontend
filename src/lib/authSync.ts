/**
 * Authentication synchronization utility for cross-tab authentication state management
 */

export class AuthSync {
  private static readonly STORAGE_KEY = "auth_sync";
  private static readonly SYNC_EVENT = "auth_state_changed";
  private static listeners: Set<() => void> = new Set();

  /**
   * Initialize cross-tab authentication synchronization
   */
  static init() {
    if (typeof window === "undefined") return;

    // Listen for storage changes from other tabs
    window.addEventListener("storage", this.handleStorageChange);

    // Listen for custom auth events
    window.addEventListener(this.SYNC_EVENT, this.handleAuthEvent);
  }

  /**
   * Clean up event listeners
   */
  static cleanup() {
    if (typeof window === "undefined") return;

    window.removeEventListener("storage", this.handleStorageChange);
    window.removeEventListener(this.SYNC_EVENT, this.handleAuthEvent);
    this.listeners.clear();
  }

  /**
   * Notify all tabs about authentication state change
   */
  static notifyAuthChange(isAuthenticated: boolean, userData?: any) {
    if (typeof window === "undefined") return;

    const authState = {
      isAuthenticated,
      userData,
      timestamp: Date.now(),
    };

    // Store in localStorage to trigger storage event in other tabs
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authState));

    // Dispatch custom event for current tab
    window.dispatchEvent(
      new CustomEvent(this.SYNC_EVENT, {
        detail: authState,
      })
    );
  }

  /**
   * Add listener for authentication state changes
   */
  static addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Handle storage changes from other tabs
   */
  private static handleStorageChange = (event: StorageEvent) => {
    if (event.key === this.STORAGE_KEY && event.newValue) {
      try {
        JSON.parse(event.newValue); // Validate JSON
        this.notifyListeners();
      } catch (error) {}
    }
  };

  /**
   * Handle custom auth events
   */
  private static handleAuthEvent = (event: Event) => {
    this.notifyListeners();
  };

  /**
   * Notify all registered listeners
   */
  private static notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {}
    });
  }

  /**
   * Get the latest auth state from sync storage
   */
  static getAuthState(): {
    isAuthenticated: boolean;
    userData?: any;
    timestamp: number;
  } | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Clear auth sync state
   */
  static clearAuthState() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(this.STORAGE_KEY);
    this.notifyAuthChange(false);
  }
}

// Auto-initialize when imported
if (typeof window !== "undefined") {
  AuthSync.init();
}
