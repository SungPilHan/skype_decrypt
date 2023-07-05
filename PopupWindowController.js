"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const _ = require("lodash");
const path = require("path");
const SyncTasks = require("synctasks");
const JsExceptionHandler_1 = require("./JsExceptionHandler");
const Platform_1 = require("./tools/Platform");
const ControllerID = 'PopupWindowController';
exports.PopupWindowMessage = ControllerID + '-Message';
const PopupWindowEventMessage = ControllerID + '-EventMessage';
const PopupWindowRegisterEvent = ControllerID + '-RegisterEvent';
const PopupWindowMessageProxy = ControllerID + '-MessageProxy';
const PopupWindowCreate = ControllerID + '-CreateWindow';
const PopupWindowDestroy = ControllerID + '-DestroyWindow';
const PopupWindowInvoke = ControllerID + '-InvokeMethod';
const PopupWindowInvokeForResult = ControllerID + '-InvokeMethodForResult';
const PopupWindowResultMessage = ControllerID + '-ResultMessage';
function getMessageString(windowId) {
    return exports.PopupWindowMessage + '-' + windowId;
}
function getWindowEventMessageString(windowId) {
    return PopupWindowEventMessage + '-' + windowId;
}
function getResultMessageString(windowId, method) {
    return PopupWindowResultMessage + '-' + windowId + '-' + method;
}
class PopupWindowProxy {
    constructor(_windowId, options) {
        this._windowId = _windowId;
        this._windowEventHandlers = {};
        this._messageHandler = (event, ...args) => {
            if (this._handler) {
                this._handler(...args);
            }
        };
        this._windowEventMessageHandler = (electronEvent, event, ...args) => {
            if (this._windowEventHandlers[event]) {
                const handlers = this._windowEventHandlers[event];
                for (let i = 0; i !== handlers.length; ++i) {
                    handlers[i](...args);
                }
            }
        };
        this._handler = options.onMessage;
        this._incomingMessageReg = getMessageString(this._windowId);
        this._incomingWindowEventMessageReg = getWindowEventMessageString(this._windowId);
        if (electron.remote) {
            electron.ipcRenderer.on(this._incomingMessageReg, this._messageHandler);
            electron.ipcRenderer.on(this._incomingWindowEventMessageReg, this._windowEventMessageHandler);
            electron.ipcRenderer.send(PopupWindowCreate, this._windowId, options);
        }
    }
    _sendInvoke(method, ...args) {
        electron.ipcRenderer.send(PopupWindowInvoke, this._windowId, method, ...args);
    }
    _sendInvokeWaitForResult(method) {
        const defer = SyncTasks.Defer();
        electron.ipcRenderer.once(getResultMessageString(this._windowId, method), (ElectronEvent, result) => {
            defer.resolve(result);
        });
        electron.ipcRenderer.send(PopupWindowInvokeForResult, this._windowId, method);
        return defer.promise();
    }
    show() {
        this._sendInvoke('show');
    }
    showInactive() {
        this._sendInvoke('showInactive');
    }
    hide() {
        this._sendInvoke('hide');
    }
    focusWindow() {
        this._sendInvoke('focus');
    }
    setPosition(x, y) {
        this._sendInvoke('setPosition', x, y);
    }
    setMinimumSize(width, height) {
        this._sendInvoke('setMinimumSize', width, height);
    }
    setSize(width, height) {
        this._sendInvoke('setSize', width, height);
    }
    setBounds(bounds) {
        this._sendInvoke('setBounds', bounds);
    }
    getBounds() {
        return this._sendInvokeWaitForResult('getBounds').toEs6Promise();
    }
    setIgnoreMouseEvents(ignore, options) {
        this._sendInvoke('setIgnoreMouseEvents', ignore, options);
    }
    sendMessage(...args) {
        electron.ipcRenderer.send(PopupWindowMessageProxy, this._windowId, ...args);
    }
    on(event, listener) {
        let handlers = this._windowEventHandlers[event];
        if (handlers) {
            handlers.push(listener);
        }
        else {
            this._windowEventHandlers[event] = [listener];
            electron.ipcRenderer.send(PopupWindowRegisterEvent, this._windowId, event);
        }
        return this;
    }
    removeListener(event, listener) {
        _.pull(this._windowEventHandlers[event], listener);
        return this;
    }
    destroy() {
        electron.ipcRenderer.send(PopupWindowDestroy, this._windowId);
        electron.ipcRenderer.removeListener(this._incomingMessageReg, this._messageHandler);
        electron.ipcRenderer.removeListener(this._incomingWindowEventMessageReg, this._windowEventMessageHandler);
        this._handler = undefined;
        this._windowEventHandlers = {};
    }
}
exports.PopupWindowProxy = PopupWindowProxy;
class PopupWindowController {
    constructor(logger) {
        this._windows = {};
        this._closingWindows = [];
        this._createHandler = (event, windowId, options) => {
            if (!this._windows[windowId]) {
                options.webPreferences = options.webPreferences || {};
                options.webPreferences.preload = path.join(electron.app.getAppPath(), options.preloadScript);
                options.webPreferences.nodeIntegration = false;
                options.webPreferences.webSecurity = true;
                const shouldShow = !!options.show;
                options.show = false;
                const window = new electron.BrowserWindow(options);
                window.setMenu(null);
                this._windows[windowId] = {
                    window,
                    owner: event.sender
                };
                if (options.visibleOnAllWorkspaces) {
                    window.setVisibleOnAllWorkspaces(true);
                }
                if (options.dontShare && Platform_1.isMac()) {
                    window.setContentProtection(true);
                }
                window.loadURL(options.contentUri);
                if (shouldShow) {
                    window.once('ready-to-show', () => {
                        if (!window.isDestroyed()) {
                            window.show();
                        }
                    });
                }
                this._logger.info(`[PopupWindowController][${windowId}] Created new popup window.`);
            }
            else {
                this._logger.error(`[PopupWindowController][${windowId}] Attempt to create more than one popup with same ID.`);
            }
        };
        this._registerEvent = (electronEvent, windowId, event, ...args) => {
            this._logger.info(`[PopupWindowController][${windowId}] registering event listener ${event} requested`);
            const entry = this._windows[windowId];
            if (entry && entry.window && !entry.window.isDestroyed()) {
                if (event !== 'blur') {
                    this._logger.error(`[PopupWindowController][${windowId}] event listener ${event} not supported`);
                    return;
                }
                this._logger.info(`[PopupWindowController][${windowId}] registering event listener ${event}`);
                entry.window.on(event, (...args) => {
                    if (entry && entry.window && !entry.window.isDestroyed()) {
                        this._logger.info(`[PopupWindowController][${windowId}] sending event ${event} with args (${JSON.stringify(args)})`);
                        entry.owner.send(getWindowEventMessageString(windowId), event, ...args);
                    }
                });
            }
        };
        this._invokeHandler = (event, windowId, method, ...args) => {
            const window = this._windows[windowId].window;
            if (window && !window.isDestroyed() && typeof window[method] === 'function') {
                window[method](...args);
            }
        };
        this._invokeForResultHandler = (event, windowId, method) => {
            const entry = this._windows[windowId];
            if (entry && entry.window && !entry.window.isDestroyed() && typeof entry.window[method] === 'function') {
                const result = entry.window[method]();
                entry.owner.send(getResultMessageString(windowId, method), result);
            }
            else {
                this._logger.error(`[PopupWindowController][${windowId}] Unable to return result of calling ${method}.`);
            }
        };
        this._proxyMessageHandler = (event, windowId, ...args) => {
            const entry = this._windows[windowId];
            if (entry && entry.window && !entry.window.isDestroyed() && entry.window.webContents &&
                !entry.window.webContents.isDestroyed() && event.sender === entry.owner) {
                entry.window.webContents.send(exports.PopupWindowMessage, ...args);
            }
        };
        this._popupMessageHandler = (event, ...args) => {
            const key = _.findKey(this._windows, e => !e.window.isDestroyed() && e.window.webContents && event.sender === e.window.webContents);
            if (key && !this._windows[key].owner.isDestroyed()) {
                this._windows[key].owner.send(getMessageString(key), ...args);
            }
        };
        this._destroyHandler = (event, windowId) => {
            const entry = this._windows[windowId];
            if (entry && entry.window && !entry.window.isDestroyed()) {
                this._logger.info(`[PopupWindowController][${windowId}] Closing popup window.`);
                entry.window.setClosable(true);
                this._observeClose(entry.window, windowId);
                entry.window.close();
            }
            delete this._windows[windowId];
        };
        this._destroyAllHandler = (event) => {
            _.forOwn(this._windows, (value, key) => this._destroyHandler(event, key));
        };
        this._logger = logger;
        if (electron.ipcMain) {
            electron.ipcMain.on(PopupWindowCreate, this._createHandler);
            electron.ipcMain.on(PopupWindowDestroy, this._destroyHandler);
            electron.ipcMain.on(PopupWindowInvoke, this._invokeHandler);
            electron.ipcMain.on(exports.PopupWindowMessage, this._popupMessageHandler);
            electron.ipcMain.on(PopupWindowMessageProxy, this._proxyMessageHandler);
            electron.ipcMain.on(PopupWindowRegisterEvent, this._registerEvent);
            electron.ipcMain.on(JsExceptionHandler_1.mainWindowUnloadMsgName, this._destroyAllHandler);
            electron.ipcMain.on(PopupWindowInvokeForResult, this._invokeForResultHandler);
        }
    }
    dispose() {
        electron.ipcMain.removeListener(PopupWindowCreate, this._createHandler);
        electron.ipcMain.removeListener(exports.PopupWindowMessage, this._popupMessageHandler);
        electron.ipcMain.removeListener(PopupWindowMessageProxy, this._proxyMessageHandler);
        electron.ipcMain.removeListener(PopupWindowInvoke, this._invokeHandler);
        electron.ipcMain.removeListener(PopupWindowDestroy, this._destroyHandler);
        electron.ipcMain.removeListener(PopupWindowRegisterEvent, this._registerEvent);
        electron.ipcMain.removeListener(JsExceptionHandler_1.mainWindowUnloadMsgName, this._destroyAllHandler);
        electron.ipcMain.removeListener(PopupWindowInvokeForResult, this._invokeForResultHandler);
    }
    _observeClose(window, windowId) {
        this._closingWindows.push(window);
        window.on('closed', () => {
            this._closingWindows = this._closingWindows.filter(w => w !== window);
            this._logger.info(`[PopupWindowController][${windowId}] window closed.`);
        });
    }
}
exports.PopupWindowController = PopupWindowController;
