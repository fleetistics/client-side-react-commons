import ObjectUtils from "@/app.Commons/helpers/ObjectUtils";
import { AppUserSettingsService } from "@/app.Commons/services/AppUserSettingsService";

import { LocalSettings } from "@/app.Impl/services/LocalSettings";
import { store } from "@/client-side.Commons/dataLayer/core/store";
import { MutationState, QueryState } from "@/client-side.Commons/dataLayer/core/api";
import { apiSlice } from "@/client-side.Commons/dataLayer/core/apiSlice";
import { UserSessionContext } from "@/client-side.Commons/userSession/userSessionContext";
import { UserSettings } from "@/client-side.Commons/configs/user-settings";
import { AppCommonUserSettings } from "@/app.Commons/configs/user-settings";
import { AppUserSettings } from "@/app.Impl/configs/user-settings";

type ClientAppUserSettings = {
    Settings: any,
    InstanceSettings?: any,
    SessionSettings?: any,
    LocalSettings?: any,
    ServerSettings?: any,
    BaseSettings?: any
}
export enum ClientAppUserSettings_AppLevel {
    Common = 1,
    App = 2,//default, null
    Platform = 3
}

const appSettingsApi = apiSlice/*.enhanceEndpoints({ addTagTypes: ['RawClientAppUserSettings'] })*/.injectEndpoints({
    endpoints: builder => ({
        getRawClientAppUserSettings: builder.query<ClientAppUserSettings, void>({
            async queryFn(_, api, extra, baseQuery) {
                try {
                    const tasks = [
                        baseQuery({
                            url: "users/me/settings",
                            method: 'GET',
                            params: {
                                clientApplicationId: UserSessionContext.ClientAppId,
                                clientDevicePlatformId: UserSessionContext.PlatformId
                            }
                        }),
                        LocalSettings.GetSettings(),
                        LocalSettings.GetSessionSettings()
                    ];
                    const results: any[] = await Promise.all<any>(tasks);
                    if (results![0].error) return { error: results[0].error };
                    //console.log("getRawClientAppUserSettings result", results)
                    const res = {
                        BaseSettings: UserSettings.GetSettings(),
                        Settings: {},
                        InstanceSettings: {},
                        ServerSettings: {}
                    } as ClientAppUserSettings;
                    try {
                       // console.log("getRawClientAppUserSettings LocalSettings", results[1]);
                        if (results[1]) res.LocalSettings = JSON.parse(results[1]);
                    }
                    catch (error) {
                        res.LocalSettings = {};
                        console.error(`getRawClientAppUserSettings LocalSettings parsing failed `, error, results[1]);
                    }
                    try {
                        //console.log("getRawClientAppUserSettings SessionSettings", results[2]);
                        if (results[2]) {
                            let sessionSettings = JSON.parse(results[2]);
                            if (sessionSettings && typeof sessionSettings === 'object' && sessionSettings.sessionId == UserSessionContext.SessionId) {
                                res.SessionSettings = sessionSettings.settings || {};
                            }
                        }
                    }
                    catch (error) {
                        res.SessionSettings = {};
                        console.error(`getRawClientAppUserSettings SessionSettings parsing failed `, error, results[2]);
                    }
                    ObjectUtils.extendEntity(AppCommonUserSettings.GetSettings(), res.BaseSettings);
                    ObjectUtils.extendEntity(AppUserSettings.GetSettings(), res.BaseSettings);
                    ObjectUtils.extendEntity(res.BaseSettings, res.Settings);
                    results![0].data.forEach((item: { Name: string, Value?: string }) => {
                        if (item.Value != undefined) {
                            try {
                                const val = JSON.parse(item.Value);
                               // console.log(`getRawClientAppUserSettings JSON.parse [${item.Value}] [${val}] typeof ${typeof val}`);
                                res.ServerSettings[item.Name] = val;
                                res.Settings[item.Name] = val;
                            }
                            catch (error) {
                                console.error(`getRawClientAppUserSettings parsing [${item.Value}] failed`, error);
                            }
                        }
                    });
                    if (res.LocalSettings) ObjectUtils.extendEntity(res.LocalSettings, res.Settings);
                    else res.LocalSettings = {};
                    if (res.SessionSettings) ObjectUtils.extendEntity(res.SessionSettings, res.Settings);
                    else res.SessionSettings = {};
                    //console.log("setAppUserSettings #1");
                    AppUserSettingsService.setAppUserSettings(res.Settings);
                    AppUserSettingsService.notifyAll();
                    return { data: res };
                }
                catch (error) {
                    console.error('getRawClientAppUserSettings error ', error);
                    throw error;
                }
            }

        }),
        saveInstanceSettings: builder.mutation<void, { name: string, value?: any }>({
            async queryFn(arg, api, extraOptions, baseQuery): Promise<any> {
                try {
                    api.dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings", undefined, request => {
                        //console.log('dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings"', JSON.stringify(request));
                        if (request) {
                            //console.log("arg", arg)
                            if (arg.value != undefined) {
                                request.Settings[arg.name] = arg.value;
                                request.InstanceSettings[arg.name] = arg.value;
                            }
                            else {
                                if (request.LocalSettings[arg.name] != undefined) request.Settings[arg.name] = request.LocalSettings[arg.name];
                                else if (request.SessionSettings[arg.name] != undefined) request.Settings[arg.name] = request.SessionSettings[arg.name];
                                else if (request.ServerSettings[arg.name] != undefined) request.Settings[arg.name] = request.ServerSettings[arg.name];
                                else if (request.BaseSettings[arg.name] != undefined) request.Settings[arg.name] = request.BaseSettings[arg.name];
                                else request.Settings[arg.name] = undefined;
                            }
                            //console.log("new settings", JSON.stringify(request))
                            //console.log("setAppUserSettings #2");
                            //console.log("saveInstanceSettings");
                            AppUserSettingsService.setAppUserSettings(request.Settings);
                            AppUserSettingsService.notifyPathChanged(arg.name);
                        }
                    }));
                    return { data: arg.name };
                }
                catch (error) {
                    console.error('saveInstanceSettings error ', error);
                    throw error;
                }
            }
        }),
        saveSessionSettings: builder.mutation<void, { name: string, value?: any }>({
            async queryFn(arg, api, extraOptions, baseQuery): Promise<any> {
                try {
                    //console.log('saveSessionSettings arg.curSettings ', JSON.stringify(arg.curSettings));
                    const curSettings = await api.dispatch(appSettingsApi.endpoints.getRawClientAppUserSettings.initiate()).unwrap();

                    const tmpSessionSettings = {
                        ...curSettings.SessionSettings
                    };
                    if (arg.value != undefined) tmpSessionSettings[arg.name] = arg.value;
                    else tmpSessionSettings[arg.name] = undefined;

                    await LocalSettings.SaveSessionSettings(JSON.stringify({
                        sessionId: UserSessionContext.SessionId,
                        settings: tmpSessionSettings
                    }));
                    //console.log('saveSessionSettings arg.curSettings after save', JSON.stringify(tmpSessionSettings));

                    api.dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings", undefined, request => {
                        //console.log('dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings"', JSON.stringify(request));
                        if (request) {
                            if (arg.value != undefined) {
                                request.Settings[arg.name] = arg.value;
                                request.SessionSettings = arg.value;
                                if (request.InstanceSettings[arg.name] != undefined) request.InstanceSettings[arg.name] = undefined;
                            }
                            else {
                                if (request.InstanceSettings[arg.name] != undefined) request.Settings[arg.name] = request.InstanceSettings[arg.name];
                                else if (request.LocalSettings[arg.name] != undefined) request.Settings[arg.name] = request.LocalSettings[arg.name];
                                else if (request.ServerSettings[arg.name] != undefined) request.Settings[arg.name] = request.ServerSettings[arg.name];
                                else if (request.BaseSettings[arg.name] != undefined) request.Settings[arg.name] = request.BaseSettings[arg.name];
                                else request.Settings[arg.name] = undefined;
                            }
                            request.SessionSettings = tmpSessionSettings;
                            //console.log("setAppUserSettings #3");
                            //console.log("saveSessionSettings");
                            AppUserSettingsService.setAppUserSettings(request.Settings);
                            AppUserSettingsService.notifyPathChanged(arg.name);
                        }
                    }));
                    return { data: arg.name };
                }
                catch (error) {
                    console.error('saveSessionSettings error ', error);
                    throw error;
                }
            }
        }),
        saveLocalSettings: builder.mutation<void, { name: string, value?: any }>({
            async queryFn(arg, api, extraOptions, baseQuery): Promise<any> {
                try {
                    const curSettings = await api.dispatch(appSettingsApi.endpoints.getRawClientAppUserSettings.initiate()).unwrap();

                    //console.log(`saveLocalSettings arg '${arg.name}'.curSettings `, JSON.stringify(curSettings));
                    let tmpSessionSettings: any = null;
                    const tmpLocalSettings = {
                        ...curSettings.LocalSettings
                    };
                    //console.log(`saveLocalSettings arg '${arg.name}'.curSettings #1`); 
                    if (arg.value !== undefined) {
                        tmpLocalSettings[arg.name] = arg.value;
                        if (curSettings.SessionSettings[arg.name] !== undefined) {
                            tmpSessionSettings = curSettings.SessionSettings;
                            tmpSessionSettings[arg.name] = undefined;
                            await LocalSettings.SaveSessionSettings(JSON.stringify(tmpSessionSettings));
                        }
                    }
                    else tmpLocalSettings[arg.name] = undefined;
                    //console.log(`saveLocalSettings arg '${arg.name}'.curSettings #2`); 

                    //console.log('LocalSettings.SaveSettings ', JSON.stringify(tmpLocalSettings));
                    await LocalSettings.SaveSettings(JSON.stringify(tmpLocalSettings));
                    //console.log('saveLocalSettings arg.curSettings after save', JSON.stringify(tmpLocalSettings));

                    //console.log("saveLocalSettings arg", arg)

                    api.dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings", undefined, request => {
                        //console.log(`dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings" (${arg.name})`, JSON.stringify(request));
                        //console.log("setAppUserSettings #4.0", request.Settings);
                        if (request) {
                            request.Settings = {...request.Settings};
                            //console.log("setAppUserSettings #4.1", request.Settings);
                            if (arg.value !== undefined) {
                                //console.log("setAppUserSettings #4.2", request.Settings);
                                request.Settings[arg.name] = arg.value;
                                if (tmpSessionSettings !== null) request.SessionSettings = tmpSessionSettings;
                                if (request.InstanceSettings[arg.name] !== undefined) request.InstanceSettings[arg.name] = undefined;
                            }
                            else {
                                //console.log("setAppUserSettings #4.3", request.Settings);
                                if (request.InstanceSettings[arg.name] !== undefined) request.Settings[arg.name] = request.InstanceSettings[arg.name];
                                else if (request.SessionSettings[arg.name] !== undefined) request.Settings[arg.name] = request.SessionSettings[arg.name];
                                else if (request.ServerSettings[arg.name] !== undefined) request.Settings[arg.name] = request.ServerSettings[arg.name];
                                else if (request.BaseSettings[arg.name] !== undefined) request.Settings[arg.name] = request.BaseSettings[arg.name];
                                else request.Settings[arg.name] = undefined;
                            }
                            request.LocalSettings = tmpLocalSettings;
                            //console.log(`dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings" (${arg.name}) #1`, JSON.stringify(request));
                            //console.log("setAppUserSettings #4", request.Settings);
                            //console.log("saveLocalSettings", request.Settings);
                            AppUserSettingsService.setAppUserSettings(request.Settings);
                            AppUserSettingsService.notifyPathChanged(arg.name);
                        }
                    }));
                    return { data: arg.name };
                }
                catch (error) {
                    console.error('saveLocalSettings error ', error);
                    throw error;
                }
            }
        }),
        saveServerSettings: builder.mutation<void, { name: string, value?: any, clientApplicationId?: number, clientDevicePlatformId?: number }>({
            query: data => ({
                url: "users/me/settings",
                method: 'PUT',
                body: {
                    name: data.name, value: JSON.stringify(data.value), clientApplicationId: data.clientApplicationId, clientDevicePlatformId: data.clientDevicePlatformId
                }
            }),
            async onQueryStarted(data, { dispatch, queryFulfilled }) {
                try {
                    // const tasks = [
                    //     queryFulfilled,
                    //     dispatch(appSettingsApi.endpoints.getRawClientAppUserSettings.initiate()).unwrap()
                    // ];

                    // const resultss: any[] = await Promise.all<any>(tasks);
                    //const results = await queryFulfilled;

                    await queryFulfilled;
                    const curSettings = await dispatch(appSettingsApi.endpoints.getRawClientAppUserSettings.initiate()).unwrap();

                    let tmpSessionSettings: any = null;
                    let tmpLocalSettings: any = null;
                    if (data.value != undefined) {
                        if (curSettings.SessionSettings[data.name] != undefined) {
                            tmpSessionSettings = curSettings.SessionSettings;
                            tmpSessionSettings[data.name] = undefined;
                            await LocalSettings.SaveSessionSettings(JSON.stringify(tmpSessionSettings));
                        }
                        if (curSettings.LocalSettings[data.name] != undefined) {
                            tmpLocalSettings = curSettings.LocalSettings;
                            tmpLocalSettings[data.name] = undefined;
                            await LocalSettings.SaveSettings(JSON.stringify(tmpLocalSettings));
                        }
                    }

                    //console.log('saveAppSettings queryFulfilled result ', result);
                    dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings", undefined, request => {
                        //console.log('dispatch(appSettingsApi.util.updateQueryData("getRawClientAppUserSettings"', JSON.stringify(request));
                        if (request) {
                            if (data.value != undefined) {
                                request.Settings[data.name] = data.value;
                                request.ServerSettings[data.name] = data.value;
                                if (tmpSessionSettings != null) request.SessionSettings = tmpSessionSettings;
                                if (tmpLocalSettings != null) request.LocalSettings = tmpLocalSettings;
                                if (request.InstanceSettings[data.name] != undefined) request.InstanceSettings[data.name] = undefined;
                            }
                            else {
                                request.ServerSettings[data.name] = undefined;
                                if (request.InstanceSettings[data.name] != undefined) request.Settings[data.name] = request.InstanceSettings[data.name];
                                else if (request.SessionSettings[data.name] != undefined) request.Settings[data.name] = request.SessionSettings[data.name];
                                else if (request.LocalSettings[data.name] != undefined) request.Settings[data.name] = request.LocalSettings[data.name];
                                else if (request.BaseSettings[data.name] != undefined) request.Settings[data.name] = request.BaseSettings[data.name];
                                else request.Settings[data.name] = undefined;
                            }
                            //console.log("setAppUserSettings #5");
                            //console.log("saveServerSettings");
                            AppUserSettingsService.setAppUserSettings(request.Settings);
                            AppUserSettingsService.notifyPathChanged(data.name);
                        }
                    }));
                }
                catch (error) {
                    console.error('saveServerSettings error ', error);
                }
            }
        })
    })
});

export function useSetAppSettings_onServer(): MutationState<{ name: string, value?: any, appLevel?: ClientAppUserSettings_AppLevel }, void> {
    const mut = appSettingsApi.endpoints.saveServerSettings.useMutation();
    return {
        trigger: data => mut[0]({
            ...data,
            clientApplicationId: ((data.appLevel ?? ClientAppUserSettings_AppLevel.App) > ClientAppUserSettings_AppLevel.Common ? UserSessionContext.ClientAppId : undefined),
            clientDevicePlatformId: ((data.appLevel ?? ClientAppUserSettings_AppLevel.App) > ClientAppUserSettings_AppLevel.App ? UserSessionContext.PlatformId : undefined)
        }), originalArgs: mut[1].originalArgs, isLoading: mut[1].isLoading, isError: mut[1].isError, isSuccess: mut[1].isSuccess, data: mut[1].data
    };
}
export function useSetAppSettings_onSession(): MutationState<{ name: string, value?: any }, void> {
    const mut = appSettingsApi.endpoints.saveSessionSettings.useMutation();
    return { trigger: data => mut[0](data), originalArgs: mut[1].originalArgs, isLoading: mut[1].isLoading, isError: mut[1].isError, isSuccess: mut[1].isSuccess, data: mut[1].data };
}
export function useSetAppSettings_onLocal(): MutationState<{ name: string, value?: any }, void> {
    const mut = appSettingsApi.endpoints.saveLocalSettings.useMutation();
    return { trigger: data => mut[0](data), originalArgs: mut[1].originalArgs, isLoading: mut[1].isLoading, isError: mut[1].isError, isSuccess: mut[1].isSuccess, data: mut[1].data };
}
export function useSetAppSettings_onInstance(): MutationState<{ name: string, value?: any }, void> {
    const mut = appSettingsApi.endpoints.saveInstanceSettings.useMutation();
    return { trigger: data => mut[0](data), originalArgs: mut[1].originalArgs, isLoading: mut[1].isLoading, isError: mut[1].isError, isSuccess: mut[1].isSuccess, data: mut[1].data };
}

enum SettingsTarget { Server, Session, Local, Instance };
type SetSettingsTask = {
    target: SettingsTarget,
    name: string,
    value?: any
}
const _queue: SetSettingsTask[] = [];

function processQueue() {
    const task = _queue.shift();
    if (!task) return;
    switch (task.target) {
        case SettingsTarget.Server:
            store.dispatch(appSettingsApi.endpoints.saveServerSettings.initiate({name: task.name, value: task.value}))
                .unwrap().catch(err => console.error("Settings update failed", err))
                .finally(processQueue);
            break;
        case SettingsTarget.Session:
            store.dispatch(appSettingsApi.endpoints.saveSessionSettings.initiate({name: task.name, value: task.value}))
                .unwrap().catch(err => console.error("Settings update failed", err))
                .finally(processQueue);
            break;
        case SettingsTarget.Local:
            store.dispatch(appSettingsApi.endpoints.saveLocalSettings.initiate({name: task.name, value: task.value}))
                .unwrap().catch(err => console.error("Settings update failed", err))
                .finally(processQueue);
            break;
        case SettingsTarget.Instance:
            store.dispatch(appSettingsApi.endpoints.saveInstanceSettings.initiate({name: task.name, value: task.value}))
                .unwrap().catch(err => console.error("Settings update failed", err))
                .finally(processQueue);
            break;
        default:
            break;
    }
}

function enqueueTask(settingsTask: SetSettingsTask) {
    _queue.push(settingsTask);
    if (_queue.length === 1) processQueue();
}

export async function setAppSettings_onServerAsync(name: string, value?: any) {
    await store.dispatch(appSettingsApi.endpoints.saveServerSettings.initiate({name: name, value: value})).unwrap();
}

export async function setAppSettings_onSessionAsync(name: string, value?: any) {
    await store.dispatch(appSettingsApi.endpoints.saveSessionSettings.initiate({name: name, value: value})).unwrap();
}

export async function setAppSettings_onLocalAsync(name: string, value?: any) {
    await store.dispatch(appSettingsApi.endpoints.saveLocalSettings.initiate({name: name, value: value})).unwrap();
}

export async function setAppSettings_onInstanceAsync(name: string, value?: any) {
    await store.dispatch(appSettingsApi.endpoints.saveInstanceSettings.initiate({name: name, value: value})).unwrap();
}

export function setAppSettings_onServerEnqueue(name: string, value?: any) {
    enqueueTask({target: SettingsTarget.Server, name, value});
}

export function setAppSettings_onSessionEnqueue(name: string, value?: any) {
    enqueueTask({target: SettingsTarget.Session, name, value});
}

export function setAppSettings_onLocalEnqueue(name: string, value?: any) {
    enqueueTask({target: SettingsTarget.Local, name, value});
}

export function setAppSettings_onInstanceEnqueue(name: string, value?: any) {
    enqueueTask({target: SettingsTarget.Instance, name, value});
}

export function useGetRawAppUserSettings(): QueryState<ClientAppUserSettings> {
    return appSettingsApi.useGetRawClientAppUserSettingsQuery() as QueryState<ClientAppUserSettings>;

}
export function useGetObjAppSettings(path: string, defaultValue?: any): QueryState<any> {
    return appSettingsApi.useGetRawClientAppUserSettingsQuery(undefined, {
        selectFromResult: (result) => {
            //console.log(`useGetBoolAppSettings selectFromResult result`, result);
            if (result.data) {
                //console.log(`useGetBoolAppSettings selectFromResult (result.data) `, iGetValue(result.data.Settings, path, false, true) as boolean);
                return { ...result, data: result.data.Settings[path] ?? defaultValue };
            }
            else {
                //console.log(`useGetBoolAppSettings selectFromResult empty data  result`, result);
                return result;
            }
        }
    }) as QueryState<any>;
}
export function useGetStringAppSettings(path: string, defaultValue?: string): QueryState<string> {
    return appSettingsApi.useGetRawClientAppUserSettingsQuery(undefined, {
        selectFromResult: (result) => {
            //console.log(`useGetBoolAppSettings selectFromResult result`, result);
            if (result.data) {
                //console.log(`useGetBoolAppSettings selectFromResult (result.data) `, iGetValue(result.data.Settings, path, false, true) as boolean);
                return { ...result, data: result.data.Settings[path] ?? defaultValue };
            }
            else {
                //console.log(`useGetBoolAppSettings selectFromResult empty data  result`, result);
                return result;
            }
        }
    }) as QueryState<string>;
}
export function useGetBoolAppSettings(path: string, defaultValue?: boolean): QueryState<boolean> {
    return appSettingsApi.useGetRawClientAppUserSettingsQuery(undefined, {
        selectFromResult: (result) => {
            //console.log(`useGetBoolAppSettings selectFromResult result`, result);
            if (result.data) {
                //console.log(`useGetBoolAppSettings selectFromResult (result.data) `, iGetValue(result.data.Settings, path, false, true) as boolean);
                return { ...result, data: result.data.Settings[path] ?? defaultValue };
            }
            else {
                //console.log(`useGetBoolAppSettings selectFromResult empty data  result`, result);
                return result;
            }
        }
    }) as QueryState<boolean>;
}
export function useGetNumberAppSettings(path: string, defaultValue?: number): QueryState<number> {
    return appSettingsApi.useGetRawClientAppUserSettingsQuery(undefined, {
        selectFromResult: (result) => {
            //console.log(`useGetBoolAppSettings selectFromResult result`, result);
            if (result.data) {
                //console.log(`useGetBoolAppSettings selectFromResult (result.data) `, iGetValue(result.data.Settings, path, false, true) as boolean);
                return { ...result, data: result.data.Settings[path] ?? defaultValue };
            }
            else {
                //console.log(`useGetBoolAppSettings selectFromResult empty data  result`, result);
                return result;
            }
        }
    }) as QueryState<number>;
}

