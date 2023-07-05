"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WindowManager {
    constructor() {
        this._windows = {};
    }
    register(window, id) {
        this._windows[id] = window;
    }
    unregister(id) {
        delete this._windows[id];
    }
    unregisterAll() {
        this._windows = {};
    }
    getWindow(id) {
        return this._windows[id];
    }
}
exports.default = new WindowManager();
