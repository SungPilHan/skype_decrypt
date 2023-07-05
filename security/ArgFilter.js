"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArgFilter {
    static isUnsecure(argList) {
        return argList ? argList.some(arg => ArgFilter.unsecure.some(regx => regx.test(arg))) : false;
    }
}
ArgFilter.unsecure = [
    /disable-web-security/i,
    /proxy-server/i,
    /proxy-pac-url/i,
    /allow-running-insecure-content/i,
    /renderer-cmd-prefix/i,
    /no-sandbox/i,
    /gpu-launcher/i,
    /host-rules/i,
    /utility-cmd-prefix/i,
    /nacl-loader-cmd-prefix/i
];
exports.ArgFilter = ArgFilter;
