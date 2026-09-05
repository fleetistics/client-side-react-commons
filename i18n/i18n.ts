import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getErrorMessage } from '@/client-side.Commons/dataLayer/apiError';
import { store } from '@/client-side.Commons/dataLayer/store';
import { translationApi } from '@/app.DataLayer/translations/translationApi';
import { getI18nPlatform, setI18nPlatform, setI18nTestMode, type I18nPlatform } from './platform';
import { createTranslationBackend, ENGLISH, knownEnglishTexts } from './translationBackend';
import { TRANSLATION_NAMESPACE } from './translationUpdater';
import { createUnknownStringReporter, type UnknownStringReporter } from './unknownStringReporter';

const STORAGE_KEY = 'language';

/** What t() returns for every key in test mode, regardless of language or key text. */
export const TEST_TRANSLATION_VALUE = '[test-translation]';

const getStoredLanguage = async (storage: I18nPlatform['storage']): Promise<string> => {
  try {
    return (await storage.getItem(STORAGE_KEY)) ?? ENGLISH;
  } catch {
    return ENGLISH;
  }
};

// Goes through the shared apiSlice rather than a bare fetch(), same reasoning as
// translationBackend.ts's fetchTranslationTable: automatic retry-on-5xx and the
// W3C trace-context header this app's other requests get for free. Called by
// unknownStringReporter's timer/background flush, never from a render, so
// initiate() (RTK Query's supported non-hook dispatch) is used instead of a hook.
async function reportUnknownTranslations(texts: string[]): Promise<void> {
  try {
    await store
      .dispatch(translationApi.endpoints.reportUnknownTranslations.initiate(texts))
      .unwrap();
  } catch (error) {
    throw new Error(`Failed to report unknown translations: ${getErrorMessage(error)}`);
  }
}

let reporter: UnknownStringReporter | null = null;

export interface InitI18nOptions {
  /**
   * For UI tests / offline demos: t() always returns TEST_TRANSLATION_VALUE, no matter
   * the key or language, and initI18n never attaches the server-backed translation
   * backend, the unknown-string reporter, or (via translationUpdater's isI18nTestMode
   * check) the background poller — nothing here talks to the server. Defaults to false.
   */
  testMode?: boolean;
}

/**
 * Called once from the app root, before the app renders — never from a test. `platform`
 * supplies the storage/lifecycle primitives that differ between web and React Native
 * (see app.Impl/i18n/platform.ts in each app); everything else here is shared.
 */
export async function initI18n(platform: I18nPlatform, options?: InitI18nOptions): Promise<void> {
  const testMode = options?.testMode ?? false;
  setI18nPlatform(platform);
  setI18nTestMode(testMode);

  const storedLanguage = await getStoredLanguage(platform.storage);

  if (testMode) {
    await i18next
      .use(initReactI18next)
      .init({
        lng: storedLanguage,
        fallbackLng: false,
        defaultNS: TRANSLATION_NAMESPACE,
        interpolation: { escapeValue: false },
        // No backend, no resources — every key is "missing" by construction, so this
        // handler alone decides what every t() call returns.
        resources: {},
        parseMissingKeyHandler: () => TEST_TRANSLATION_VALUE,
      });
    return;
  }

  reporter = createUnknownStringReporter({
    report: reportUnknownTranslations,
    onBackground: platform.lifecycle.onBackground,
  });

  await i18next
    .use(createTranslationBackend())
    .use(initReactI18next)
    .init({
      lng: storedLanguage,
      // Every bundle already resolves an untranslated entry to its own English text at
      // load time (see translationBackend's toResourceBundle), so i18next's own
      // fallback-language chain would never have anything left to add.
      fallbackLng: false,
      defaultNS: TRANSLATION_NAMESPACE,
      interpolation: { escapeValue: false },
      saveMissing: true,
      // A key i18next can't find is, by construction, a token absent from the loaded
      // bundle entirely — the known-but-untranslated case never reaches here, it's
      // already resolved to English text inside the bundle. knownEnglishTexts is a
      // belt-and-suspenders re-check against a possibly-stale bundle, not the primary
      // signal.
      missingKeyHandler: (_lngs, _ns, key) => {
        if (!knownEnglishTexts.has(key)) {
          reporter?.addUnknown(key);
        }
      },
    });
}

/** Switches the active language and persists the choice for next launch. */
export function changeLanguage(code: string): Promise<unknown> {
  void getI18nPlatform()
    .storage.setItem(STORAGE_KEY, code)
    .catch(() => {
      // Storage unavailable (private-mode quirks, etc.) — the switch still applies for
      // this session via i18next's own in-memory state.
    });
  return i18next.changeLanguage(code);
}
