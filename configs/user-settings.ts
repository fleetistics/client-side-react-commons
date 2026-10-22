import { CommonUserSettingsEnum } from "./user-settings-enum";

export class CommonUserSettings {
    public static GetSettings() {
        const res = {} as any;
        res[CommonUserSettingsEnum.kbUrl] = 'https://crewchief.biz/knowledgebase?solution_id=';

        return res;
    }
}