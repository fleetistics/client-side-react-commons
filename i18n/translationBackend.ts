import type { BackendModule } from 'i18next';
import { getErrorMessage } from '@/client-side.Commons/dataLayer/apiError';
import { store } from '@/client-side.Commons/dataLayer/store';
import { translationApi } from '@/app.Commons/dataLayer/hooks/translationApi';
import type { TranslationTable } from './translationTypes';

export const ENGLISH = 'en';

/**
 * Goes through the shared apiSlice rather than a bare fetch(), even though this runs
 * outside any component (i18next's own lifecycle calls read(), not a render): the
 * automatic retry-on-5xx and W3C trace-context header this app's other requests get
 * for free would otherwise silently not apply to translation loads. `initiate()` is
 * RTK Query's supported way to dispatch a query imperatively outside React — see
 * https://redux-toolkit.js.org/rtk-query/usage/usage-without-react-hooks.
 */
export async function fetchTranslationTable(
  lang: string,
  sinceUnixSeconds?: number
): Promise<TranslationTable> {
  try {
    return await store
      .dispatch(
        translationApi.endpoints.getTranslationTable.initiate(
          { lang, sinceUnixSeconds },
          // Every call here — an i18next language load or a background poll — wants
          // genuinely fresh data, never a cached response from a moment ago.
          { forceRefetch: true }
        )
      )
      .unwrap();
  } catch (error) {
    throw new Error(`Failed to fetch translations for "${lang}": ${getErrorMessage(error)}`);
  }
}

const toResourceBundle = (table: TranslationTable): Record<string, string> =>
  Object.fromEntries(table.Tokens.map((entry) => [entry.Text, entry.Translation ?? entry.Text]));

/**
 * Known-English-strings registry, refreshed on every language load (including "en"
 * itself). Independent of whichever language is actually active in i18next — a
 * currently-loaded non-English bundle already carries an English-fallback value for
 * every known-but-untranslated token (see toResourceBundle), so in steady state this
 * set and "not found in the active bundle" agree; this exists as the belt-and-suspenders
 * check requested when this scheme was designed, and as a safety net if the active
 * bundle is temporarily behind the background updater.
 */
export const knownEnglishTexts = new Set<string>();

const refreshKnownEnglishTexts = (): void => {
  fetchTranslationTable(ENGLISH)
    .then((table) => {
      knownEnglishTexts.clear();
      table.Tokens.forEach((entry) => knownEnglishTexts.add(entry.Text));
    })
    .catch(() => {
      // Best-effort — a stale/empty registry just means the missing-key check falls
      // back to i18next's own "not in the loaded bundle" signal.
    });
};

/**
 * i18next backend fetching the translations API's `GET /api/translations/{lang}` and
 * reshaping it into i18next's flat `{ key: value }` resource format. Untranslated
 * entries resolve to their own English text at load time (Translation ?? Text), so a
 * known-but-not-yet-translated string is a normal resource-bundle hit, not a miss —
 * only a token absent from the server's response at all reaches i18next's own
 * missing-key path, which is exactly what should be reported back as unknown.
 */
export function createTranslationBackend(): BackendModule {
  return {
    type: 'backend',
    init() {},
    read(language, _namespace, callback) {
      void (async () => {
        try {
          const table = await fetchTranslationTable(language);
          if (language === ENGLISH) {
            knownEnglishTexts.clear();
            table.Tokens.forEach((entry) => knownEnglishTexts.add(entry.Text));
          } else {
            refreshKnownEnglishTexts();
          }
          callback(null, toResourceBundle(table));
        } catch (error) {
          callback(error as Error, null);
        }
      })();
    },
  };
}
