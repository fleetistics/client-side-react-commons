import { UserSettingsEnum } from "./user-settings-enums";

export class UserSettings {
    public static GetSettings() {
        const res = {} as any;
        res[UserSettingsEnum.kbUrl] = 'https://crewchief.biz/knowledgebase?solution_id=';

        return res;
    }
}