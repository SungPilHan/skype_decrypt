"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const fs = require("fs");
const path = require("path");
const kFlushTimeout = 100;
exports.SettingsKeys = {
    AutoStartEnabled: 'app.autoStartEnabled',
    OnCloseKeepRunning: 'app.onCloseKeepRunning',
    Crashed: 'didCrashInLastSession',
    RegisterSkypeUri: 'app.registerSkypeUri',
    LaunchMinimized: 'app.launchMinimized',
    CheckNonAdminUser: 'app.checkNonAdmin',
    LoggingLevel: 'logging.level',
    LoggingEnabled: 'logging.enabled',
    LoggingConsole: 'logging.console',
    UpgradedFromDelphi: 'app.upgradedFromDelphi',
    UpgradedFromDelphiDate: 'app.upgradedFromDelphiDate',
    WindowPosition: 'main-window.position',
    WindowMaximized: 'main-window.isMaximised',
    ZoomLevel: 'main-window.zoom-level'
};
class Settings {
    constructor(filename) {
        this.data = new Map();
        this.filename = filename;
    }
    init() {
        this._readFromDisk();
    }
    has(key) {
        return this.data.has(key);
    }
    get(key, defaultValue) {
        return this.data.has(key) ? this.data.get(key) : defaultValue;
    }
    delete(key) {
        this.data.delete(key);
        this._flushToDisk();
    }
    set(key, value) {
        this.data.set(key, value);
        this._flushToDisk();
    }
    _readFromDisk() {
        let stats;
        try {
            stats = fs.lstatSync(this.filename);
        }
        catch (error) {
        }
        try {
            if (stats && stats.isFile()) {
                let json = fs.readFileSync(this.filename, 'utf8');
                this.data = objectToMap(JSON.parse(json));
            }
        }
        catch (error) {
            console.warn(`Error reading settings: ${error.message}`);
        }
    }
    _writeToDisk() {
        try {
            let json = JSON.stringify(mapToObject(this.data));
            fs.writeFileSync(this.filename, json);
        }
        catch (error) {
            console.warn(`Error writing settings: ${error.message}`);
        }
    }
    _flushToDisk() {
        let callback = () => {
            this._writeToDisk();
        };
        clearTimeout(this.flushTimer);
        this.flushTimer = setTimeout(callback, kFlushTimeout);
    }
}
exports.Settings = Settings;
function mapToObject(map) {
    let obj = Object.create(null);
    map.forEach((value, key) => {
        obj[key] = value;
    });
    return obj;
}
function objectToMap(obj) {
    let map = new Map();
    for (let key of Object.keys(obj)) {
        map.set(key, obj[key]);
    }
    return map;
}
function buildSettings() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/Settings').settings;
    }
    else {
        let filename = path.join(electron.app.getPath('userData'), 'settings.json');
        return new Settings(filename);
    }
}
exports.settings = buildSettings();
