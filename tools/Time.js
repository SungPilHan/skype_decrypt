"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getTimezone() {
    const pad = function (n, c) {
        n = n + '';
        if (n.length < c) {
            let zeros = [];
            zeros.length = ++c - n.length;
            return zeros.join('0') + n;
        }
        else {
            return n;
        }
    };
    let sign;
    let timezone = new Date().getTimezoneOffset() * (-1);
    if (timezone >= 0) {
        sign = '+';
    }
    else {
        sign = '-';
    }
    timezone = Math.abs(timezone);
    const minutes = timezone % 60;
    const hours = (timezone - minutes) / 60;
    const normailzedMinutes = pad(minutes.toString(), 2);
    const normalizedHours = pad(hours.toString(), 2);
    return sign + normalizedHours + ':' + normailzedMinutes;
}
exports.getTimezone = getTimezone;
function secondsToTime(seconds) {
    let days = Math.floor(seconds / 86400);
    let hours = Math.floor((seconds - (days * 86400)) / 3600);
    let minutes = Math.floor((seconds - (hours * 3600) - (days * 86400)) / 60);
    let secs = seconds - (days * 86400) - (hours * 3600) - (minutes * 60);
    function numPad(numero) {
        let prefix = (numero < 10) ? '0' : '';
        return prefix + numero;
    }
    let humanReadable = (days > 0) ? days + 'days ' : '';
    return humanReadable + numPad(hours) + ':' + numPad(minutes) + ':' + numPad(secs);
}
exports.secondsToTime = secondsToTime;
