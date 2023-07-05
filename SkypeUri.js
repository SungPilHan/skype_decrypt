"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const events_1 = require("events");
const Platform_1 = require("./tools/Platform");
const Settings_1 = require("./Settings");
class SkypeUri extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this._logger = logger;
    }
    newInstallation() {
        if (!Settings_1.settings.has(Settings_1.SettingsKeys.RegisterSkypeUri)) {
            this.setRegistered(true);
            return true;
        }
        return false;
    }
    isRegistered() {
        return Settings_1.settings.get(Settings_1.SettingsKeys.RegisterSkypeUri, false);
    }
    setRegistered(enabled) {
        Settings_1.settings.set(Settings_1.SettingsKeys.RegisterSkypeUri, enabled);
        if (enabled) {
            this._registerProtocol();
        }
        else {
            this._unregisterProtocol();
        }
    }
    ensureRegistered() {
        this.setRegistered(this.isRegistered());
    }
    handleArgs(rawArgs) {
        if (rawArgs.length < 1) {
            return;
        }
        let skypeUri = this._findUri(rawArgs);
        if (!skypeUri) {
            this._logger.info('[SkypeUri] No Skype URI found in args');
            return;
        }
        this._logger.info(`[SkypeUri] Handle Skype URI ${skypeUri}`);
        this._lastCommand = skypeUri;
        this._emitSkypeUriAvailable();
    }
    getUri() {
        let uri = this._lastCommand;
        this._lastCommand = undefined;
        return uri;
    }
    _registerProtocol() {
        if (Platform_1.isLinux()) {
            return;
        }
        if (!electron_1.app.isDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL) || Platform_1.isWindows()) {
            if (electron_1.app.setAsDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL, process.execPath, ['--'])) {
                this._logger.info(`[SkypeUri] Successfully registered as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
            else {
                this._logger.info(`[SkypeUri] Failed registering as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
        }
    }
    _unregisterProtocol() {
        if (Platform_1.isLinux()) {
            return;
        }
        if (electron_1.app.isDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
            if (electron_1.app.removeAsDefaultProtocolClient(SkypeUri.SKYPE_PROTOCOL)) {
                this._logger.info(`[SkypeUri] Successfully unregistered as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
            else {
                this._logger.info(`[SkypeUri] Failed unregistering as client for ${SkypeUri.SKYPE_PROTOCOL} protocol`);
            }
        }
        else {
            this._logger.info(`[SkypeUri] No need to unregister as client for ${SkypeUri.SKYPE_PROTOCOL} protocol - not registered`);
        }
    }
    _findUri(rawArgs) {
        let match;
        for (let i = 0; i < rawArgs.length; i++) {
            let item = rawArgs[i];
            if (item.startsWith(`${SkypeUri.SKYPE_PROTOCOL}:`)) {
                match = item;
                break;
            }
        }
        return match;
    }
    _emitSkypeUriAvailable() {
        this.emit('skype-uri-available');
    }
}
SkypeUri.SKYPE_PROTOCOL = 'skype';
exports.SkypeUri = SkypeUri;
