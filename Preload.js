"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CrashReporting_1 = require("./CrashReporting");
const PreloadShared_1 = require("./PreloadShared");
const s4lApi = require("./S4lApi");
CrashReporting_1.initializeCrashReporter();
PreloadShared_1.init();
if (window.location.hostname === '' && window.location.pathname !== 'blank') {
    s4lApi.apiForMain();
    PreloadShared_1.escapeFullScreen();
}
