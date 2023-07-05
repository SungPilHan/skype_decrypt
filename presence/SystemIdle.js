"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const Platform_1 = require("../tools/Platform");
const DEFAULT_IDLE_SECONDS = 3 * 60;
const IDLE_POLLING_TIME = 60 * 1000;
exports.SystemIdleIpcChannel = 'get-system-idle';
class SystemIdle {
    constructor(logger, ecsConfig) {
        this._isIdle = false;
        this._idleWindow = DEFAULT_IDLE_SECONDS;
        this._logger = logger;
        this._ecsConfig = ecsConfig;
        if (this._ecsConfig) {
            this._ecsConfig.on('ecs-data-ready', () => {
                this._setupIdleChecking();
            });
            this._ecsConfig.on('ecs-data-changed', () => {
                this._setupIdleChecking();
            });
        }
        electron.app.on('ready', () => {
            electron.powerMonitor.on('suspend', () => {
                this._handleSystemEvent(true, 'suspend');
            });
            electron.powerMonitor.on('resume', () => {
                this._handleSystemEvent(false, 'resume');
            });
            if (!Platform_1.isLinux()) {
                electron.powerMonitor.on('lock-screen', () => {
                    this._handleSystemEvent(true, 'lock-screen');
                });
                electron.powerMonitor.on('unlock-screen', () => {
                    this._handleSystemEvent(false, 'unlock-screen');
                });
            }
            if (!Platform_1.isWindows()) {
                electron.powerMonitor.on('shutdown', () => {
                    this._handleSystemEvent(true, 'shutdown');
                });
            }
        });
        electron.app.on('browser-window-focus', (event, window) => {
            this._handleSystemEvent(false, 'browser-window-focus');
        });
        electron.ipcMain.on(exports.SystemIdleIpcChannel, (event) => {
            event.returnValue = this.isIdle();
        });
    }
    isIdle() {
        return this._isIdle;
    }
    _handleSystemEvent(idle, eventName) {
        if (idle !== this._isIdle) {
            this._isIdle = idle;
            this._logger.info(`[SystemIdle] Handling system event '${eventName}', isIdle: ${this._isIdle}`);
            this._rescheduleCheck();
            this._sendIdleChangedEvent();
        }
    }
    _setupIdleChecking() {
        const ecsData = this._ecsConfig.getData();
        if (ecsData) {
            this._idleWindow = ecsData.idleSystemTimeWindow ? ecsData.idleSystemTimeWindow : DEFAULT_IDLE_SECONDS;
        }
        if (!this._idleTimer) {
            this._logger.info('[SystemIdle] Setting up system idle time check');
            this._rescheduleCheck();
        }
    }
    _sendIdleChangedEvent() {
        this._logger.debug(`[SystemIdle] Notify: isIdle: ${this._isIdle}`);
        electron.app.emit('system-idle-changed', this._isIdle);
    }
    _rescheduleCheck() {
        if (this._idleTimer) {
            clearTimeout(this._idleTimer);
        }
        this._idleTimer = setTimeout(() => {
            this._checkIdleTime();
            this._rescheduleCheck();
        }, IDLE_POLLING_TIME);
    }
    _checkIdleTime() {
        const desktopIdle = this._getModule();
        if (desktopIdle) {
            const idleTime = desktopIdle.getIdleTime();
            this._logger.debug(`[SystemIdle] _checkIdleTime: ${idleTime}s, old isIdle: ${this._isIdle}`);
            const idleNow = idleTime > this._idleWindow;
            if (idleNow !== this._isIdle) {
                this._isIdle = idleNow;
                this._logger.info(`[SystemIdle] Idle time: ${idleTime}s, isIdle: ${this._isIdle}`);
                this._sendIdleChangedEvent();
            }
        }
    }
    _getModule() {
        if (!this._module) {
            try {
                this._module = require('desktop-idle');
            }
            catch (error) {
                this._logger.error('[SystemIdle] Initializing module failed. Error: ', error);
            }
        }
        return this._module;
    }
}
exports.SystemIdle = SystemIdle;
let instance;
function getInstance() {
    return instance;
}
exports.getInstance = getInstance;
function init(logger, ecsConfig) {
    instance = new SystemIdle(logger, ecsConfig);
}
exports.init = init;
