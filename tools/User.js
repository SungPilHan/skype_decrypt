"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const electron = require("electron");
const _ = require("lodash");
const Platform_1 = require("../tools/Platform");
const Settings_1 = require("../Settings");
const WIN_ADMIN = 'S-1-5-32-544';
const MAC_ADMIN = 'admin';
const LINUX_ADMIN = 'sudo';
class User {
    constructor(logger) {
        this._isAdmin = false;
        this._ranDetection = false;
        this._detectionEnabled = false;
        this._logger = logger;
        this._detectionEnabled = Settings_1.settings.get(Settings_1.SettingsKeys.CheckNonAdminUser, false);
        this._checkAdmin();
        this._logger.info(`[User] User is Admin: ${this._isAdmin}, detection ran: ${this._ranDetection}`);
    }
    isAdmin() {
        return this._isAdmin;
    }
    isAdminString() {
        if (this._ranDetection) {
            return this._isAdmin ? 'true' : 'false';
        }
        else {
            return 'unknown';
        }
    }
    _checkAdmin() {
        if (!this._detectionEnabled) {
            this._isAdmin = true;
            return;
        }
        if (Platform_1.isWindows()) {
            try {
                const groups = _.uniq(child_process_1.execSync('whoami /groups /fo csv', { stdio: 'pipe' }).toString().split(/[,\r\n]+/))
                    .map(value => _.trim(value, '"'));
                this._isAdmin = _.includes(groups, WIN_ADMIN);
                this._ranDetection = true;
            }
            catch (error) {
                this._logger.error('[User] Check if user is admin failed', error);
            }
        }
        else {
            try {
                const groups = child_process_1.execSync('id -Gn', { stdio: 'pipe' }).toString().split(/\s+/);
                this._isAdmin = _.includes(groups, Platform_1.isMac() ? MAC_ADMIN : LINUX_ADMIN);
                this._ranDetection = true;
            }
            catch (error) {
                this._logger.error('[User] Check if user is admin failed', error);
            }
        }
    }
}
exports.User = User;
let instance;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/User').getInstance();
    }
    return instance;
}
exports.getInstance = getInstance;
function init(logger) {
    instance = new User(logger);
}
exports.init = init;
