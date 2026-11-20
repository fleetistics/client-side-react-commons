import type { UserSessionInfoDto } from "../dataLayer/open-api";

export class UserSessionContext {
    public static AssignUserId( userId: number) {
        this.mUserId = userId;
    }
    public static AssignUserSessionInfo(userSessionInfo: UserSessionInfoDto) {
        this.mUserSessionInfo = userSessionInfo;
    }
    public static get CompanyId(): number|undefined {
        return this.mUserSessionInfo?.CompanyId;
    }
    public static get UserId(): number {
        return this.mUserSessionInfo?.UserId??this.mUserId;
    }
    public static get UserSessionInfo(): UserSessionInfoDto | undefined {
        return this.mUserSessionInfo;
    }

    private static mUserId: number;
    private static mUserSessionInfo?:UserSessionInfoDto

}