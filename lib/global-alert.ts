export interface IGlobalAlert {
    ShowInfo: (message: string, title?: string) => void
    ShowWarningQuestion: (message: string, title?: string, clickTitle?: string, clickFunc?: () => void) => void
    ShowWarning: (message: string, title?: string) => void
    ShowError: (message: string, title?: string, retryFunc?: () => void, closeFunc?: () => void) => void
}

export class GlobalAlert {
    public static ShowInfo(message: string, title?: string) {
        if (GlobalAlert.mInstance) GlobalAlert.mInstance.ShowInfo(message, title);
        else console.warn('GlobalAlert::ShowInfo without mInstance');
    }
    public static ShowWarningQuestion(message: string, title?: string, clickTitle?: string, clickFunc?: () => void) {
        if (GlobalAlert.mInstance) GlobalAlert.mInstance.ShowWarningQuestion(message, title, clickTitle, clickFunc);
        else console.warn('GlobalAlert::ShowWarningQuestion without mInstance');
    }
    public static ShowWarning(message: string, title?: string) {
        if (GlobalAlert.mInstance) GlobalAlert.mInstance.ShowWarning(message, title);
        else console.warn('GlobalAlert::ShowWarning without mInstance');
    }
    public static ShowError(message: string, title?: string, retryFunc?: () => void, closeFunc?: () => void) {
        if (GlobalAlert.mInstance) GlobalAlert.mInstance.ShowError(message, title, retryFunc, closeFunc);
        else console.warn('GlobalAlert::ShowError without mInstance');
    }

    public static SetInstance(instance?: IGlobalAlert) {
        GlobalAlert.mInstance = instance;
    }
    protected static mInstance?: IGlobalAlert;
}
