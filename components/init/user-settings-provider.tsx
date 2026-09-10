import { InitError } from "@/app.Impl/initComponents/init-error";
import { InitWaiter } from "@/app.Impl/initComponents/init-waiter";
import { useGetRawAppUserSettings } from "@/client-side.Commons/dataLayer/api/appSettingsApi";
import { getErrorMessage } from "@/client-side.Commons/dataLayer/core/apiError";

export function UserSettingsProvider(props: {
    children: React.ReactNode;
    // Test/harness escape hatch: renders children immediately, ignoring this provider's own
    // loading/error gating. Left undefined/false in every real app entry point.
    skipBlocking?: boolean;
}) {
    const userAppSettings = useGetRawAppUserSettings();
    if ( props.skipBlocking ) return props.children;
    if ( userAppSettings.isLoading ) return <InitWaiter loadingLabel="Loading settings..." />;
    else if ( userAppSettings.isError ) return <InitError
            title="Session check failed"
            errorMsg={getErrorMessage(userAppSettings.error)}
            
          />;
    return props.children;
}