"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Logger_1 = require("./logger/Logger");
class WindowBase {
    constructor(options, shouldBeHidden) {
        this._instance = new electron_1.BrowserWindow(options);
        this._instance.once('ready-to-show', () => {
            Logger_1.getInstance().info('[WindowBase] Window is ready to show.');
            if (shouldBeHidden) {
                this._instance.showInactive();
                this._instance.hide();
            }
            else {
                this._instance.show();
            }
        });
    }
    get window() {
        return this._instance;
    }
    get webContents() {
        return this._instance.webContents;
    }
}
exports.WindowBase = WindowBase;
