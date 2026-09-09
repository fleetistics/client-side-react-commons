export class UserSessionContext {
    public static AssignValues(clientAppId: number, platformId: number, sessionId: number, userId: number) {
        this.mClientAppId = clientAppId;
        this.mPlatformId = platformId;
        this.mSessionId = sessionId;
        this.mUserId = userId;
    }

    public static get ClientAppId(): number {
        return this.mClientAppId;
    }
    public static get PlatformId(): number {
        return this.mPlatformId;
    }
    public static get SessionId(): number {
        return this.mSessionId;
    }
    public static get UserId(): number {
        return this.mUserId;
    }

    private static mClientAppId: number;
    private static mPlatformId: number;
    private static mSessionId: number;
    private static mUserId: number;

}