/**
 * Native jsbridge interface
 * Provides communication between WebView and native app
 */
export interface JsBridge {
  /**
   * Get authentication token from native app
   * @param callback - Called with token string when available
   */
  getToken: (callback: (token: string) => void) => void;
}

declare global {
  interface Window {
    proxy?: JsBridge;
  }
}

export {};
