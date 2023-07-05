"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Url = require("url");
const Logger_1 = require("../logger/Logger");
const WindowsManager_1 = require("../WindowsManager");
function install() {
    electron_1.app.on('browser-window-created', (evt, window) => {
        Logger_1.getInstance().info('[WindowInterceptor] Registering new window interceptor.');
        window.webContents.on('new-window', (event, urlParam, frameName, disposition, options) => {
            Logger_1.getInstance().info('[WindowInterceptor] Trying to create new-window: ', urlParam);
            let url = Url.parse(urlParam);
            event.preventDefault();
            if (url.protocol !== 'file:') {
                Logger_1.getInstance().info('[WindowInterceptor] Opening in new window: ', url.href);
                electron_1.shell.openExternal(urlParam);
            }
            else if (disposition === 'new-window' && urlParam === 'file:///ChildWindow.html') {
                options = options || {};
                options.webPreferences = options.webPreferences || {};
                if (frameName.startsWith('modal')) {
                    options.parent = window;
                    options.modal = true;
                    options.minimizable = false;
                    options.maximizable = false;
                    options.fullscreenable = false;
                }
                options.webPreferences.sandbox = true;
                options.webPreferences.plugins = false;
                options.webPreferences.webviewTag = true;
                options.webPreferences.nativeWindowOpen = false;
                options.webPreferences.nodeIntegration = false;
                options.webPreferences.preload = '';
                options.webPreferences['preloadURL'] = '';
                options.webPreferences.additionalArguments = ['--skype-process-type=childWindow'];
                const childWindow = new electron_1.BrowserWindow(options);
                WindowsManager_1.default.register(childWindow, frameName);
                childWindow.on('closed', () => {
                    WindowsManager_1.default.unregister(frameName);
                });
                event.newGuest = childWindow;
                Logger_1.getInstance().info('[WindowInterceptor] Opening child window: ', urlParam);
            }
        });
    });
}
exports.install = install;
