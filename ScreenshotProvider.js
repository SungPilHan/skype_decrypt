"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
class ScreenshotProvider {
    takeCurrentWindowScreenshot() {
        const result = new Promise((resolve, reject) => {
            const window = electron_1.BrowserWindow.getFocusedWindow() || electron_1.BrowserWindow.getAllWindows()[0];
            if (!window) {
                return reject(new Error('There was no window to take a screenshot of'));
            }
            window.capturePage(image => {
                resolve(image.toDataURL());
                this._latestScreenshot = image.toPNG();
            });
        });
        return result;
    }
    getLatestScreenshot() {
        return this._latestScreenshot;
    }
}
exports.ScreenshotProvider = ScreenshotProvider;
function getInstance() {
    if (electron_1.remote) {
        return electron_1.remote.require(__dirname + '/ScreenshotProvider').screenshotManager;
    }
    else {
        return exports.screenshotManager;
    }
}
exports.getInstance = getInstance;
function init() {
    exports.screenshotManager = new ScreenshotProvider();
}
exports.init = init;
