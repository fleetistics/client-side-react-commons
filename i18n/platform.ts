/**
 * The only environment-specific seam this i18n module needs: persisting the chosen
 * language, and knowing when the app/tab moves to and from the background. Everything
 * else in this folder is plain JS/React and runs unmodified on web and React Native —
 * only these two concerns differ (localStorage/document vs. AsyncStorage/AppState), so
 * each platform supplies one small adapter (see app.Impl/i18n/platform.ts) instead of
 * this code branching on platform itself.
 */
export interface I18nStorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface I18nLifecycleAdapter {
  /** Calls `onRefresh` whenever the app/tab returns to the foreground. Returns an unsubscribe function. */
  onForeground(onRefresh: () => void): () => void;
  /** Calls `onHidden` whenever the app/tab moves to the background. Returns an unsubscribe function. */
  onBackground(onHidden: () => void): () => void;
}

export interface I18nPlatform {
  storage: I18nStorageAdapter;
  lifecycle: I18nLifecycleAdapter;
}

let current: I18nPlatform | null = null;

/** Set once by initI18n() at app startup. */
export function setI18nPlatform(platform: I18nPlatform): void {
  current = platform;
}

/** Read by call sites far from app startup (changeLanguage, useTranslationUpdater). */
export function getI18nPlatform(): I18nPlatform {
  if (!current) {
    throw new Error('getI18nPlatform() called before initI18n() — call initI18n() first, at app startup.');
  }
  return current;
}

let testMode = false;

/** Set once by initI18n() at app startup, from its `testMode` option. */
export function setI18nTestMode(enabled: boolean): void {
  testMode = enabled;
}

/**
 * True when initI18n() was called with `testMode: true` — every t() call returns the
 * same fixed string with no backend attached, and background polling/reporting never
 * start, so nothing in this module talks to the server. Read by translationUpdater
 * (skip polling) and i18n.ts itself (skip the backend, the reporter, and saveMissing).
 */
export function isI18nTestMode(): boolean {
  return testMode;
}
