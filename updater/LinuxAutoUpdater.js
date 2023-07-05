"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const SkypeVersionUtility_1 = require("./SkypeVersionUtility");
const UpdateEventType_1 = require("./UpdateEventType");
class LinuxAutoUpdater extends events_1.EventEmitter {
    constructor(logger, ecsConfig, currentVersion) {
        super();
        this._logger = logger;
        this._ecsConfig = ecsConfig;
        this._currentVersion = currentVersion;
    }
    setFeedURL(options) {
    }
    getFeedURL() {
        return '';
    }
    checkForUpdates() {
        if (!this._ecsConfig) {
            return;
        }
        this.emit(UpdateEventType_1.updateEventName.CheckingForUpdates);
        this._logger.info('[LinuxAutoUpdater] Checking for update');
        let ecsData = this._ecsConfig.getData();
        if (ecsData && ecsData.appDisabled) {
            this._logger.info('[LinuxAutoUpdater] Application disabled - report mandatory system update');
            this.emit(UpdateEventType_1.updateEventName.UpdateDownloaded, {}, 'none', 'skypeforlinux mandatory', new Date(), 'none');
        }
        if (ecsData && ecsData.lastVersionAvailable &&
            SkypeVersionUtility_1.SkypeVersionUtility.getHigherOfVersions(this._currentVersion, ecsData.lastVersionAvailable) !== this._currentVersion) {
            this._logger.info(`[LinuxAutoUpdater] Update found: ${ecsData.lastVersionAvailable}`);
            this.emit(UpdateEventType_1.updateEventName.UpdateDownloaded, {}, 'none', 'skypeforlinux', new Date(), 'none');
        }
        else {
            this._logger.info('[LinuxAutoUpdater] Update not found.');
            this.emit(UpdateEventType_1.updateEventName.NoUpdateAvailable);
        }
    }
    quitAndInstall() {
    }
}
exports.LinuxAutoUpdater = LinuxAutoUpdater;
