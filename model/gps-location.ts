export enum GPSLocationAccuracy {
    Fine = 1,
    Fair = 2,
    Poor = 3,
    Bad = 4
}

export type GPSLocation = {
    Lat?: number,
    Lng?: number,
    Alt?: number,
    Acc?: number,
    Odo?: number,
    Speed?:number,
    TimeStamp?:number
}