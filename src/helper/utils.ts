import chalk from "chalk";

export const generateRandomUniqueTag = (n: number = 4): string => {
    let max = 11;
    if (n > max) return `${generateRandomUniqueTag(max)}${generateRandomUniqueTag(n - max)}`;
    max = Math.pow(10, n + 1);
    const min = max / 10;
    return (Math.floor(Math.random() * (max - min + 1)) + min).toString().substring(1);
};

export const extractNumbers = (content: string): number[] => {
    const search = content.match(/(-\d+|\d+)/g);
    if (search !== null) return search.map((string) => parseInt(string));
    return [];
};
function timeSinceRecursive(
    date: Date,
    depth = 1,
    localization?: {
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
    }
) {
    let seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    seconds = Math.abs(seconds);
    let intervalType: string = "";
    let remainder = 0;
    let extra = "";

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
        remainder = seconds % 31536000;
        intervalType = localization ? localization.year ?? "year" : "year";
    } else {
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            remainder = seconds % 2592000;
            intervalType = localization ? localization.month ?? "month" : "month";
        } else {
            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                remainder = seconds % 86400;
                intervalType = localization ? localization.day ?? "day" : "day";
            } else {
                interval = Math.floor(seconds / 3600);
                if (interval >= 1) {
                    remainder = seconds % 3600;
                    intervalType = localization ? localization.hour ?? "hour" : "hour";
                } else {
                    interval = Math.floor(seconds / 60);
                    if (interval >= 1) {
                        remainder = seconds % 60;
                        intervalType = localization ? localization.minute ?? "minute" : "minute";
                    } else {
                        interval = seconds;
                        intervalType = localization ? localization.second ?? "second" : "second";
                    }
                }
            }
        }
    }

    if ((interval > 1 || interval === 0) && !localization) {
        intervalType += "s";
    }
    if (remainder > 0 && depth > 1) {
        extra = timeSinceRecursive(new Date(Date.now() - 1000 * remainder), depth - 1, localization);
    }
    return interval + " " + intervalType + " " + extra;
}
export const timeSince = (
    date: Date,
    depth: number = 1,
    localization?: {
        year?: string;
        month?: string;
        day?: string;
        hour?: string;
        minute?: string;
        second?: string;
    }
) => {
    return timeSinceRecursive(date, depth, localization);
};

export const formatNumber = (num: number, fixed = 2) => {
    return num.toFixed(fixed).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
};

export const getPercentageChange = (initial: number, final: number) => {
    if (initial < final) return ((final - initial) / initial) * 100;
    return ((initial - final) / initial) * 100;
};

export const debounce = <T extends (...args: any) => any>(func: T, wait: number, immediate: boolean) => {
    let timeout: any;
    return (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            if (!immediate) func(args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(args);
    };
};

//https://stackoverflow.com/a/23593099/13069078
export function formatDate(date: string | Date) {
    var d = new Date(date),
        month = "" + (d.getMonth() + 1),
        day = "" + d.getDate(),
        year = d.getFullYear();

    // if (month.length < 2) month =  month;
    if (day.length < 2) day = "0" + day;

    return [year, month, day].join("-");
}

export function objectToUrlQuery<T extends { [key: string]: any }>(obj: T): string {
    return Object.keys(obj)
        .map((key) => {
            return encodeURIComponent(key) + "=" + obj[key];
        })
        .join("&");
}

export const getDay = (plusDay: number = 0) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + plusDay);
    return date;
};
export const extractNumber = (str: string) => {
    const regex = /([\d,]+)[\d,]*/g;
    const match = regex.exec(str);
    if (match) {
        return match[1].replace(/,/g, "");
    }
    return;
};

const colors: (keyof typeof chalk)[] = ["blue", "red", "green", "cyan", "magenta", "yellow"];

export const getRandomColor = () => {
    return colors[(colors.length * Math.random()) | 0];
};

export function countDecimalPlaces(num: number) {
    let str = "" + num;
    let index = str.indexOf(".");
    if (index >= 0) {
        return str.length - index - 1;
    } else {
        return 0;
    }
}

//groupBy with typed typescript
export function groupBy<T, K extends keyof T>(array: T[], key: K): { [key: string]: T[] } {
    return array.reduce((acc: { [key: string]: T[] }, curr) => {
        const keyValue = curr[key];
        //@ts-ignore
        if (!acc[keyValue]) {
            //@ts-ignore
            acc[keyValue] = [];
        }
        //@ts-ignore
        acc[keyValue].push(curr);
        return acc;
    }, {});
}

//https://stackoverflow.com/a/51712612
/**
 *
 * @param input ex : "bluebird"
 * @param pattern ex : "*bird"
 * @returns true or false, true based on example
 */
export const wildcardCheck = function (input: string, pattern: string) {
    var regExpEscape = function (s: string) {
        return s.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    };
    const re = new RegExp("^" + pattern.toLowerCase().split(/\*+/).map(regExpEscape).join(".*") + "$");
    const match = input.toLowerCase().match(re);
    if (match && match.length >= 1) return true;
    return false;
    //return input.match(re) !== null && input.match(re).length >= 1;
};
//https://github.com/jonatanpedersen/quoted/blob/e72a980b600d07477ecc9e7028c8a5a62886faf6/index.js#L48
function quotedRegExp(str: string) {
    const expression = /(["'])(?:(?=(\\?))\2.)*?\1/gm;
    const texts = [];
    const emptyString = "";
    var match;
    while ((match = expression.exec(str))) {
        const text = match[0].slice(1, -1);
        if (text !== emptyString) {
            texts.push(text);
        }
    }

    return texts;
}

//https://github.com/jonatanpedersen/quoted/blob/e72a980b600d07477ecc9e7028c8a5a62886faf6/index.js#L5
export function quoted(str: string) {
    const backslash = "\\";
    const doubleQuote = '"';
    const singleQuote = "'";
    const emptyString = "";
    const texts = [];
    var quote;
    var escaping;
    var recording;
    var text;

    for (var i = 0; i < str.length; i++) {
        const char = str[i];

        escaping = char === backslash && !escaping;

        if (!escaping) {
            if (!recording) {
                if (char === singleQuote || char === doubleQuote) {
                    quote = char;
                    recording = true;
                    text = emptyString;
                }
            } else {
                if (char === quote) {
                    quote = emptyString;
                    recording = false;

                    if (text !== emptyString) {
                        texts.push(text);
                    }
                } else {
                    text += char;
                }
            }
        } else {
            text += char;
        }
    }

    return texts;
}
