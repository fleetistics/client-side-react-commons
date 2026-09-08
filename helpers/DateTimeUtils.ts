export default class DateTimeUtils {
    static DefaultDateFormat: string = "mm/dd/yy";
    static DefaultTimeFormat = 'hh:MM a';

    private static mDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    private static mFullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    private static mMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    private static mMillSecsInHour = 3600000;
    private static mSecsInDay = 86400;
    private static mLocalTimeZoneOffset = (new Date()).getTimezoneOffset() / -60;

    static GetCurrentTZOffset() {
        return this.mLocalTimeZoneOffset;
    }

    static CurUnixTime() {
        return DateTimeUtils.DateToUnixTime(new Date());
    }
    static DateToUnixTime(val: Date) {
        return val ? Math.floor(val.getTime() / 1000) : 0;
    }

    static RestoreDateFromUnixTime(unixTime: number): Date {
        return new Date(unixTime * 1000);
    }

    /*     static RestoreDateFromUnixTimeInTZOffset(unixTime: number, tzOffset: number): Date {
            return new Date(1000 * unixTime + (tzOffset - this.mLocalTimeZoneOffset) * this.mMillSecsInHour);
        }
    
        static RestoreDateFromUnixTimeInLocalTZ(unixTime: number): Date {
            return DateTimeUtils.RestoreDateFromUnixTimeInTZOffset(unixTime, 0);
        } */

    static GetFormattedUnixDateTime(value: number): string {
        return DateTimeUtils.GetFormattedDateTime(DateTimeUtils.RestoreDateFromUnixTime(value));
    }
    static GetFormattedUnixDate(value: number, format: string | undefined = undefined): string {
        return DateTimeUtils.GetFormattedDate(DateTimeUtils.RestoreDateFromUnixTime(value), format);
    }
    static GetFormattedUnixTime(value: number, format: string | undefined = undefined): string {
        return DateTimeUtils.GetFormattedTime(DateTimeUtils.RestoreDateFromUnixTime(value), format);
    }
    static GetFormattedUnixTime24(value: number): string {
        return DateTimeUtils.GetFormattedTime(DateTimeUtils.RestoreDateFromUnixTime(value), "HH:MM");
    }    

    static GetFormattedDateTime(value: Date): string {
        return DateTimeUtils.GetFormattedDate(value) + ', ' + DateTimeUtils.GetFormattedTime(value);
    }


    static GetFormattedDate(value: Date, format: string | undefined = undefined): string {
        if (!value) return "";
        let formattedDate = format || this.DefaultDateFormat;

        if (formattedDate.indexOf('ddd') !== -1) {
            formattedDate = formattedDate.replace('ddd', '|||');
        }
        if (formattedDate.indexOf('dd') !== -1) {
            const day = value.getDate();
            formattedDate = day > 9 ? formattedDate.replace('dd', day.toString()) : formattedDate.replace('dd', '0' + day);
        }
        if (formattedDate.indexOf('d') !== -1) {
            formattedDate = formattedDate.replace('d', value.getDate().toString());
        }
        if (formattedDate.indexOf('|||') !== -1) {
            formattedDate = formattedDate.replace('|||', this.mDays[value.getDay()]);
        }
        if (formattedDate.indexOf('mmmm') !== -1) {
            formattedDate = formattedDate.replace('mmmm', this.mFullMonths[value.getMonth()]);
        }
        if (formattedDate.indexOf('mmm') !== -1) {
            formattedDate = formattedDate.replace('mmm', this.mMonths[value.getMonth()]);
        }
        if (formattedDate.indexOf('mm') !== -1) {
            const month = value.getMonth() + 1;
            formattedDate = month > 9 ? formattedDate.replace('mm', month.toString()) : formattedDate.replace('mm', '0' + month);
        }
        if (formattedDate.indexOf('qq') !== -1) {
            let quarter = "";
            const month = value.getMonth();
            if (month >= 0 && month <= 2) {
                quarter = "Q1";
            }
            else if (month >= 3 && month <= 5) {
                quarter = "Q2";
            }
            else if (month >= 6 && month <= 8) {
                quarter = "Q3";
            }
            else if (month >= 9 && month <= 11) {
                quarter = "Q4";
            }
            formattedDate = formattedDate.replace('qq', quarter);
        }
        if (formattedDate.indexOf('m') !== -1) {
            const month = value.getMonth() + 1;
            formattedDate = formattedDate.replace('m', month.toString());
        }
        if (formattedDate.indexOf('yyyy') !== -1) {
            const year = value.getFullYear();
            formattedDate = formattedDate.replace('yyyy', year.toString());
        }
        else if (formattedDate.indexOf('yy') !== -1) {
            let year = value.getFullYear();
            if (year > 1999) year = year - 2000;
            formattedDate = year > 9 ? formattedDate.replace('yy', year.toString()) : formattedDate.replace('yy', '0' + year);
        }
        return formattedDate;
    }
    static GetFormattedTime24(value: Date): string {
        return DateTimeUtils.GetFormattedTime(value, "HH:MM");
    }

    static GetFormattedTime(value: Date, format: string | undefined = undefined): string {
        if (!value) return "";
        let formattedTime = format || this.DefaultTimeFormat;
        if (formattedTime.indexOf('HH') !== -1) {
            const hours = value.getHours();
            if (hours > 9) formattedTime = formattedTime.replace('HH', hours.toString());
            else formattedTime = formattedTime.replace('HH', '0' + hours);
        }
        if (formattedTime.indexOf('H') !== -1) {
            const hours = value.getHours();
            formattedTime = formattedTime.replace('H', hours.toString());
        }
        if (formattedTime.indexOf('hh') !== -1) {
            let hours = value.getHours();
            if (hours > 12) hours -= 12;
            if (hours > 9) formattedTime = formattedTime.replace('hh', hours.toString());
            else formattedTime = formattedTime.replace('hh', '0' + hours);
        }
        if (formattedTime.indexOf('h') !== -1) {
            let hours = value.getHours();
            if (hours > 12) hours -= 12;
            formattedTime = formattedTime.replace('h', hours.toString());
        }
        if (formattedTime.indexOf('MM') !== -1) {
            const minutes = value.getMinutes();
            formattedTime = minutes > 9 ? formattedTime.replace('MM', minutes.toString()) : formattedTime.replace('MM', '0' + minutes);
        }
        if (formattedTime.indexOf('M') !== -1) {
            const minutes = value.getMinutes();
            formattedTime = formattedTime.replace('M', minutes.toString());
        }
        if (formattedTime.indexOf('ss') !== -1) {
            const seconds = value.getSeconds();
            formattedTime = seconds > 9 ? formattedTime.replace('ss', seconds.toString()) : formattedTime.replace('ss', '0' + seconds);
        }
        if (formattedTime.indexOf('s') !== -1) {
            const seconds = value.getSeconds();
            formattedTime = formattedTime.replace('s', seconds.toString());
        }
        if (formattedTime.indexOf('a') !== -1) {
            if (value.getHours() > 11) formattedTime = formattedTime.replace('a', 'pm');
            else formattedTime = formattedTime.replace('a', 'am');
        }
        if (formattedTime.indexOf('A') !== -1) {
            if (value.getHours() > 11) formattedTime = formattedTime.replace('A', 'PM');
            else formattedTime = formattedTime.replace('A', 'AM');
        }
        if (formattedTime.indexOf('z') !== -1) {
            //formattedTime = formattedTime.replace('z', this.GetTimeZoneKey(value));
        }
        if (formattedTime.indexOf('Z') !== -1) {
            formattedTime = formattedTime.replace('Z', (value.getTimezoneOffset() / 60).toString());
        }
        return formattedTime;
    }
    static FormatShortDateInterval(dateStart: Date, dateEnd: Date) {
        return DateTimeUtils.FormatSmartSecsInterval((dateEnd.valueOf() - dateStart.valueOf()) / 1000);
    }
    static FormatSafeHoursMinsInterval(interval: number) {
        if ( interval > 59) return DateTimeUtils.FormatHoursMinsInterval(interval);
        else return DateTimeUtils.FormatSmartSecsInterval(interval, true);
    }
    static FormatHoursMinsInterval(interval: number, showZero: boolean = false) {
        let hours = Math.floor(interval / (60 * 60));
        let mins = Math.floor((interval-hours*60 * 60) / (60));
        if (hours === 0 && mins === 0 && !showZero) {
            return '';
        }
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;        
    }
    static FormatShortestInterval(interval: number, showZero: boolean = false) {
        let tmpValue = Math.floor(interval / (365 * 24 * 60 * 60));
        if (tmpValue > 0) return tmpValue + " y";

        tmpValue = Math.floor(interval / (24 * 60 * 60));
        if (tmpValue > 0) return tmpValue + " d";

        tmpValue = Math.floor(interval / (60 * 60));
        if (tmpValue > 0) return tmpValue + " h";

        tmpValue = Math.floor(interval / (60));
        if (tmpValue > 0) return tmpValue + " m";

        tmpValue = Math.floor(interval);
        if (tmpValue > 0) return tmpValue + " s";
        else if (showZero) return "0 s";
        else return '';

    }
    static FormatSmartSecsInterval(interval: number, showZero: boolean = false) {
        if (showZero && !interval) return "0s";
        let res = "";
        const years = Math.floor(interval / (365 * 24 * 60 * 60));
        if (years > 0) res = years + " y";
        const restDays = interval - years * 365 * 24 * 60 * 60;
        const days = Math.floor(restDays / (24 * 60 * 60));
        const restHours = restDays - days * 24 * 60 * 60;
        let hours = Math.floor(restHours / (60 * 60));
        const restMins = restHours - hours * 60 * 60;
        let mins = Math.floor(restMins / 60);
        let secs = Math.round(restMins - mins * 60);

        if (days > 2) {
            if (!res.length) res = days + " d";
            else return res + " " + Math.round(restDays / (24 * 60 * 60)) + " d";
        }
        else {
            if (res.length > 0) return res;
            hours += days * 24;
        }

        if (hours > 0) {
            if (!res.length) res = hours + " h";
            else return res + " " + Math.round(restHours / (60 * 60)) + " h";
        }
        else if (res.length > 0) return res;

        if (mins > 0) {
            if (secs > 25) mins++;
            if (!res.length) return mins + " m";
            else return res + " " + Math.round(restMins / 60) + " m";
        }
        else if (res.length > 0) return res;

        if (secs > 0) {
            if (!res.length) return secs + " s";
            else return res + " " + secs + " s";
        }

        return res;
    }
    static FormatSmartSecsIntervalDots(interval: number, showZero: boolean = false) {
        if (showZero && !interval) return "0s";
        let res = "";
        const years = Math.floor(interval / (365 * 24 * 60 * 60));
        if (years > 0) res = years + " y";
        const restDays = interval - years * 365 * 24 * 60 * 60;
        const days = Math.floor(restDays / (24 * 60 * 60));
        const restHours = restDays - days * 24 * 60 * 60;
        let hours = Math.floor(restHours / (60 * 60));
        const restMins = restHours - hours * 60 * 60;
        let mins = Math.floor(restMins / 60);
        let secs = Math.round(restMins - mins * 60);

        if (days > 1) {
            if (!res.length) res = days + " d";
            else return res + " " + Math.round(restDays / (24 * 60 * 60)) + " d";
        }
        else {
            if (res.length > 0) return res;
            hours += days * 24;
        }

        let addDot = false;
        if (hours > 0) {
            if (!res.length) { res = hours + ""; addDot = true; }
            else return res + " " + Math.round(restHours / (60 * 60)) + ".00";
        }
        else if (res.length > 0) return res;

        if (mins > 0) {
            if (secs > 25) mins++;
            if (!res.length) return "0." + mins.toString().padStart(2, '0');
            else return res +  (addDot ? "." : " ") + Math.round(restMins / 60).toString().padStart(2, '0');
        }
        else if (res.length > 0) return res + (addDot ? ".00" : "");

        return res;
    }

    static SmartFormatUnixTime(unixTime: number): { short: string, full: string } {
        const today = new Date();
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        let short;
        if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate()) {
            short = DateTimeUtils.GetFormattedTime(date);
        }
        else if (today.getFullYear() === date.getFullYear()) {
            short = DateTimeUtils.GetFormattedDate(date, "mmm dd");
        }
        else {
            short = DateTimeUtils.GetFormattedDate(date);
        }
        return { short, full: DateTimeUtils.GetFormattedDateTime(date) };
    }
    static SmartStringFormatUnixTime(unixTime: number) {
        const today = new Date();
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        let short;
        if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate()) {
            return DateTimeUtils.GetFormattedTime(date);
        }
        else if (today.getFullYear() === date.getFullYear()) {
            short = DateTimeUtils.GetFormattedDate(date, "mmm dd");
        }
        else {
            short = DateTimeUtils.GetFormattedDate(date);
        }
        return DateTimeUtils.GetFormattedTime(date) + '(' + short + ')';
    }
    static SmartStringTodayTimeOrDateTime(unixTime: number, today?: Date) {
        if (!today) today = new Date();
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        let short;
        if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate()) {
            return DateTimeUtils.GetFormattedTime(date);
        }
        else if (today.getFullYear() === date.getFullYear()) {
            short = DateTimeUtils.GetFormattedDate(date, "mmm dd");
        }
        else {
            short = DateTimeUtils.GetFormattedDate(date);
        }
        return DateTimeUtils.GetFormattedTime(date) + '(' + short + ')';
    }
    static SmartObjTodayTimeOrDateTime(unixTime: number, today?: Date) {
        if (!today) today = new Date();
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        let short;
        if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate()) {
            return [DateTimeUtils.GetFormattedTime(date)];
        }
        else if (today.getFullYear() === date.getFullYear()) {
            return [DateTimeUtils.GetFormattedTime(date), DateTimeUtils.GetFormattedDate(date, "mmm dd")];
        }
        else {
            return [DateTimeUtils.GetFormattedTime(date), DateTimeUtils.GetFormattedDate(date)];
        }
    }
    static ObjTimeAndDate(unixTime: number) {
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        return [DateTimeUtils.GetFormattedTime(date), DateTimeUtils.GetFormattedDate(date)];
    }
    static ObjTime24AndDate(unixTime: number) {
        const date = DateTimeUtils.RestoreDateFromUnixTime(unixTime);
        return [DateTimeUtils.GetFormattedTime(date, "HH:MM"), DateTimeUtils.GetFormattedDate(date)];
    }    
    static IsToday(date: Date, today: Date) {
        if (today.getFullYear() === date.getFullYear() && today.getMonth() === date.getMonth() && today.getDate() === date.getDate()) {
            return 1;
        }
        else if (today.getFullYear() === date.getFullYear()) {
            return 2;
        }
        else return 0;
    }

    static GetOneDay() {
        return DateTimeUtils.mSecsInDay;
    }

    static GetCurrentUnixTime() {
        return Math.floor((new Date()).getTime() / 1000);
    }

    static GetStartOfHourUnixTime(val?: Date) {
        const dt = val || new Date();
        return Math.floor(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), dt.getHours(), 0, 0, 0).getTime() / 1000);
    }

    static GetStartOfDayUnixTime(val?: Date) {
        const dt = val || new Date();
        return Math.floor(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).getTime() / 1000);
    }

    static GetStartOfWeekUnixTime(val?: Date) {
        const dt = val || new Date();
        const start = Math.floor(new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).getTime() / 1000);
        return start - dt.getDay() * DateTimeUtils.mSecsInDay;
    }

    static GetStartOfMonthUnixTime(val?: Date) {
        const dt = val || new Date();
        return Math.floor(new Date(dt.getFullYear(), dt.getMonth(), 1, 0, 0, 0, 0).getTime() / 1000);
    }

    static GetStartOfYearUnixTime(val?: Date) {
        const dt = val || new Date();
        return Math.floor(new Date(dt.getFullYear(), 1, 1, 0, 0, 0, 0).getTime() / 1000);
    }
    static GetNumDaysFromUnixDate(val: number) {
        return Math.round(val / DateTimeUtils.mSecsInDay);
    }
}