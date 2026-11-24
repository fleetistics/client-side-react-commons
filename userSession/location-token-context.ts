import type { RefreshAppLocationTokenResponseData } from "../dataLayer/open-api";

export class LocationTokenContext {
    public static AssignFirstAppLocationToken(appLocationToken: RefreshAppLocationTokenResponseData) {
        this.mFirstAppLocationToken = appLocationToken;
    }
    public static GetFirstAppLocationToken(): RefreshAppLocationTokenResponseData | undefined {
        return this.mFirstAppLocationToken;
    }
    private static mFirstAppLocationToken?:RefreshAppLocationTokenResponseData

}