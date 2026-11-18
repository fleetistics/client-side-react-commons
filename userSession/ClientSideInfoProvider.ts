import type { ClientSideInfo } from "../dataLayer/open-api";

export class ClientSideInfoProvider {
    public static GetInstance(): ClientSideInfoProvider {
        if (!this._instance) {
            this._instance = new ClientSideInfoProvider();
            //initi code
        }
        return this._instance;
    }
    /** Apps register their platform-specific subclass once at startup, before anything asks for the info. */
    public static SetInstance(instance: ClientSideInfoProvider) {
        this._instance = instance;
    }
    protected constructor() {
    }
    /** Snapshot of the client info for request bodies; await CollectInfo() first when it must be fresh. */
    public static get Info(): ClientSideInfo {
        return {
            AppId: this._instance.mApplicationId,
            PlatformId: this._instance.mPlatformId,
            PlatformDetails: this._instance.mPlatformDetails,
            AppVersion: this._instance.mAppVersion,
            AppHash: this._instance.mAppHash,
            FCM_FID: this._instance.mFCM_FID,
        };
    }
    public static async CheckInfoCollected(): Promise<void> {
        return Promise.resolve();
    }

    public get NotificationToken(): string | undefined {
        return this.mFCM_FID;
    }

    public get ApplicationId(): number {
        return this.mApplicationId;
    }

    public get PlatformId(): number {
        return this.mPlatformId;
    }

    public get PlatformDetails(): string {
        return this.mPlatformDetails;
    }

    public get AppVersion(): string {
        return this.mAppVersion;
    }

    public get AppHash(): string {
        return this.mAppHash;
    }

    public get DeviceUID(): string | undefined {
        return this.mDeviceUID;
    }

    public SetNotificationToken(token: string) {
        if (this.mFCM_FID) {
            console.warn('SetNotificationToken for the second time ' + (this.mFCM_FID != token))
        }
        else this.mFCM_FID = token;
    }
    protected mFCM_FID?: string;
    protected mApplicationId:number = -1
    protected mPlatformId:number = -1
    protected mPlatformDetails: string = '';
    protected mAppVersion: string = '';
    protected mAppHash: string = '';
    protected mDeviceUID?: string;


    protected static _instance: ClientSideInfoProvider;
}
