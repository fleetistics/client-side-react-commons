export class UserSessionContext {
    public static AssignUserId( userId: number) {
        this.mUserId = userId;
    }

    public static get UserId(): number {
        return this.mUserId;
    }

    private static mUserId: number;

}