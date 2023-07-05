"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Platform_1 = require("../tools/Platform");
function readEtcReleaseFile() {
    try {
        return fs.readFileSync('/etc/os-release', { encoding: 'utf-8' });
    }
    catch (e) {
        return '';
    }
}
function readUsrReleaseFile() {
    try {
        return fs.readFileSync('/usr/lib/os-release', { encoding: 'utf-8' });
    }
    catch (e) {
        return '';
    }
}
function getPrettyName() {
    const unknownDistroName = 'unknown';
    if (!Platform_1.isLinux()) {
        return undefined;
    }
    const releaseFile = readEtcReleaseFile() || readUsrReleaseFile();
    if (!releaseFile) {
        return unknownDistroName;
    }
    const prettyNameLine = releaseFile.split('\n')
        .filter((line) => line.startsWith('PRETTY_NAME'))[0];
    return prettyNameLine ? prettyNameLine.slice(12) : unknownDistroName;
}
exports.getPrettyName = getPrettyName;
