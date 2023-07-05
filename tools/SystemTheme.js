"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const Platform_1 = require("../tools/Platform");
exports.SystemDarkThemeIpcChannel = 'get-system-dark-theme';
class SystemTheme {
    constructor(logger) {
        this._logger = logger;
        if (Platform_1.isMac()) {
            electron.systemPreferences.subscribeNotification('AppleInterfaceThemeChangedNotification', () => {
                this._sendThemeChangedEvent();
            });
        }
        electron.ipcMain.on(exports.SystemDarkThemeIpcChannel, (event) => {
            event.returnValue = this._isDarkTheme();
        });
    }
    _isDarkTheme() {
        return Platform_1.isMac() ? electron.systemPreferences.isDarkMode() : undefined;
    }
    _sendThemeChangedEvent() {
        const dark = this._isDarkTheme();
        this._logger.debug(`[SystemTheme] Notify: isDarkMode: ${dark}`);
        electron.app.emit('system-theme-changed', dark);
    }
}
exports.SystemTheme = SystemTheme;
let instance;
function getInstance() {
    return instance;
}
exports.getInstance = getInstance;
function init(logger) {
    instance = new SystemTheme(logger);
}
exports.init = init;
