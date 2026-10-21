export interface IGlobalToast {
    ShowError: (message: string) => void
    ShowWarning: (message: string) => void
    ShowSuccess: (message: string) => void
    HideAll: () => void
}

export class GlobalToast {
    public static ShowError(message: string) {
        if (GlobalToast.mInstance) GlobalToast.mInstance.ShowError(message);
        else console.warn('GlobalToast::ShowError without mInstance');
    }
    public static ShowWarning(message: string) {
        if (GlobalToast.mInstance) GlobalToast.mInstance.ShowWarning(message);
        else console.warn('GlobalToast::ShowWarning without mInstance');
    }
    public static ShowSuccess(message: string) {
        if (GlobalToast.mInstance) GlobalToast.mInstance.ShowSuccess(message);
        else console.warn('GlobalToast::ShowSuccess without mInstance');
    }
    public static HideAll() {
        if (GlobalToast.mInstance) GlobalToast.mInstance.HideAll();
        else console.warn('GlobalToast::HideAll without mInstance');
    }

    public static SetInstance(instance?: IGlobalToast) {
        GlobalToast.mInstance = instance;
    }
    protected static mInstance?: IGlobalToast;
}
