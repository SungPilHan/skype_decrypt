"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const FocusOutline_1 = require("./FocusOutline");
const PopupWindowController_1 = require("../PopupWindowController");
class PopupWindowApiImpl {
    constructor() {
        electron.ipcRenderer.on(PopupWindowController_1.PopupWindowMessage, (event, ...args) => {
            if (this._handler) {
                this._handler(...args);
            }
        });
        window.addEventListener('unload', () => {
            console.log(`[PopupWindowApiImpl] window unloading`);
            electron.ipcRenderer.removeAllListeners(PopupWindowController_1.PopupWindowMessage);
        });
    }
    sendMessage(...args) {
        electron.ipcRenderer.send(PopupWindowController_1.PopupWindowMessage, ...args);
    }
    onMessage(handler) {
        this._handler = handler;
    }
    supportsTransparency() {
        return process.platform !== 'win32';
    }
    isMac() {
        return process.platform === 'darwin';
    }
    initFocusOutline() {
        if (!this._outline) {
            this._outline = new FocusOutline_1.FocusOutline(new FocusOutline_1.KeyboardNavigationEvent());
        }
    }
}
exports.PopupWindowApiImpl = PopupWindowApiImpl;
