"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
function isMac() {
    return process.platform === 'darwin';
}
exports.isMac = isMac;
function isWindows() {
    return process.platform === 'win32';
}
exports.isWindows = isWindows;
function isLinux() {
    return process.platform === 'linux';
}
exports.isLinux = isLinux;
function getOSVersion() {
    return os.release();
}
exports.getOSVersion = getOSVersion;
function getPlatformShortCode() {
    if (isMac()) {
        return 'mac';
    }
    else if (isWindows()) {
        return process.arch === 'x64' ? 'win64' : 'win';
    }
    else if (isLinux()) {
        return 'linux';
    }
    return 'unknown';
}
exports.getPlatformShortCode = getPlatformShortCode;
function pickByPlatform(win, mac, linux) {
    if (isLinux()) {
        return linux;
    }
    if (isMac()) {
        return mac;
    }
    if (isWindows()) {
        return win;
    }
    throw new Error('Trying to get setting for usupported platform.');
}
exports.pickByPlatform = pickByPlatform;
