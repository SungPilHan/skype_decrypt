"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
exports.GetSSIDRequest = 'get-ssid-request';
exports.GetSSIDResponse = 'get-ssid-response';
class SsidStore {
    constructor(logger) {
        this._logger = logger;
        electron.ipcMain.on(exports.GetSSIDRequest, (event) => {
            this._getSSID().then(ssid => {
                event.sender.send(exports.GetSSIDResponse, ssid);
            }, () => {
                event.sender.send(exports.GetSSIDResponse, null);
            });
        });
    }
    _getSSID() {
        const electronSsid = this._getElectronSsid();
        if (!electronSsid) {
            return Promise.resolve(undefined);
        }
        return electronSsid.getSSID()
            .then(ssid => {
            this._logger.debug('[SsidStore] Read SSID:', ssid);
            return ssid;
        })
            .catch(error => {
            this._logger.error('[SsidStore] Reading SSID failed. Error: ', error);
        });
    }
    _getElectronSsid() {
        if (!this._electronSsid) {
            try {
                this._electronSsid = require('electron-ssid');
            }
            catch (error) {
                this._logger.error('[SsidStore] Initializing SSID module failed. Error: ', error);
            }
        }
        return this._electronSsid;
    }
}
exports.SsidStore = SsidStore;
let instance;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/SsidStore').getInstance();
    }
    return instance;
}
exports.getInstance = getInstance;
function init(logger) {
    instance = new SsidStore(logger);
}
exports.init = init;
