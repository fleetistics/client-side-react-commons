import { useEffect, useRef } from 'react';
import i18next from 'i18next';
import { fetchTranslationTable } from './translationBackend';
import { getI18nPlatform, isI18nTestMode } from './platform';

export const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
export const TRANSLATION_NAMESPACE = 'translation';

/**
 * One poll: fetches only what changed since `sinceUnixSeconds` and merges it into the
 * live i18next resource bundle (addResources patches keys in place — components using
 * useTranslation re-render automatically, no reload needed). Returns the new cursor
 * for the next call; callers should keep using the old cursor if this rejects.
 */
export async function pollTranslationUpdates(
  language: string,
  sinceUnixSeconds: number
): Promise<number> {
  const table = await fetchTranslationTable(language, sinceUnixSeconds);
  if (table.Tokens.length > 0) {
    const resources = Object.fromEntries(
      table.Tokens.map((entry) => [entry.Text, entry.Translation ?? entry.Text])
    );
    i18next.addResources(language, TRANSLATION_NAMESPACE, resources);
  }
  return table.AsOf;
}

/**
 * Background updater: NOT a Web Worker (no CPU-heavy work here, just an occasional
 * fetch-and-merge) — a plain interval. Mount once at the app root, after initI18n() has
 * run (it reads the platform initI18n() registered, to know when the app/tab regains
 * the foreground). Polls on a timer plus an immediate extra poll on foreground, so a
 * session left backgrounded catches up right away instead of waiting out the interval.
 * A no-op in test mode (see initI18n's `testMode` option) — never polls the server.
 */
export function useTranslationUpdater(intervalMs: number = DEFAULT_POLL_INTERVAL_MS): void {
  const sinceRef = useRef(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (isI18nTestMode()) {
      return;
    }

    const poll = (): void => {
      const language = i18next.language;
      if (!language) {
        return;
      }
      pollTranslationUpdates(language, sinceRef.current)
        .then((asOf) => {
          sinceRef.current = asOf;
        })
        .catch(() => {
          // Best-effort — the next tick retries from the same cursor.
        });
    };

    const intervalId = setInterval(poll, intervalMs);
    const unsubscribe = getI18nPlatform().lifecycle.onForeground(poll);

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [intervalMs]);
}
