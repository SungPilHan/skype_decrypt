"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const childProcess = require("child_process");
const electron_1 = require("electron");
const events_1 = require("events");
const fs = require("fs");
const path = require("path");
const HttpsRequest_1 = require("../HttpsRequest");
const SkypeVersionUtility_1 = require("./SkypeVersionUtility");
class WindowsAutoUpdater extends events_1.EventEmitter {
    constructor(logger, appConfig, persistence, currentVersion, downloader, userTools) {
        super();
        this._awaitingInstallerVersionKey = 'updates.windows.awaiting-installer-version';
        this._persistence = persistence;
        this._logger = logger;
        this._installerFileName = `${appConfig.appExeName}-Setup.exe`;
        this._currentVersion = currentVersion;
        this._downloader = downloader;
        this._userTools = userTools;
    }
    setFeedURL(options) {
        this._feedUrl = options.url;
    }
    getFeedURL() {
        return this._feedUrl;
    }
    checkForUpdates() {
        this.emit('checking-for-update');
        this._logger.info('[WindowsAutoUpdater] checking for update');
        let updateRequest = new HttpsRequest_1.HttpsRequest({
            method: 'GET',
            url: this._feedUrl,
            headers: {
                'Accept': 'application/json;ver=1.0',
                'Content-Type': 'application/json'
            },
            retryIn: 3
        }, this._logger);
        updateRequest.send().then(res => {
            if (res.statusCode === 200) {
                let parsedResponse = JSON.parse(res.body);
                let url = parsedResponse.url;
                let versionFound = parsedResponse.name;
                this._logger.info(`[WindowsAutoUpdater] update found: ${JSON.stringify(parsedResponse)}. Version: ${versionFound}`);
                this.emit('update-available');
                if (this._persistence.has(this._awaitingInstallerVersionKey) &&
                    this._persistence.get(this._awaitingInstallerVersionKey) === versionFound) {
                    this._emitUpdateDownloadedWithDetails(parsedResponse);
                }
                else {
                    this._downloadUpdate(url, versionFound, parsedResponse);
                }
            }
            else {
                this._logger.info('[WindowsAutoUpdater] Update not found. Status code: ' + res.statusCode);
                this.emit('update-not-available');
            }
        }).catch((error) => {
            this._logger.error('[WindowsAutoUpdater] error retrieving the updates status: ' + error.message);
            this.emit('error', { message: error.message });
        });
    }
    quitAndInstall() {
        this._logger.info('[WindowsAutoUpdater] got quit and install command.');
        if (!this._persistence.has(this._awaitingInstallerVersionKey)) {
            this._logger.info('[WindowsAutoUpdater] quit and install interrupted - no file entry.');
            return false;
        }
        let updaterLocation = path.join(electron_1.app.getPath('userData'), this._installerFileName);
        try {
            let stats = fs.statSync(updaterLocation);
            if (stats.isFile()) {
                this._runInstaller(updaterLocation);
                return true;
            }
            else {
                this._logger.error('[WindowsAutoUpdater] Cannot install pending update as the file is missing.');
                this._persistence.delete(this._awaitingInstallerVersionKey);
            }
        }
        catch (error) {
            this._logger.error('[WindowsAutoUpdater] Cannot install pending update as the file is missing.');
            this._persistence.delete(this._awaitingInstallerVersionKey);
        }
        return false;
    }
    installMandatoryUpdatesIfPresent() {
        this._logger.info('[WindowsAutoUpdater] A try to install mandatory Updates initiated.');
        if (this._persistence.has(this._awaitingInstallerVersionKey)) {
            let awaitingVersion = SkypeVersionUtility_1.SkypeVersionUtility.extractVersionFromReleaseNameString(this._persistence.get(this._awaitingInstallerVersionKey));
            if (SkypeVersionUtility_1.SkypeVersionUtility.getHigherOfVersions(this._currentVersion, awaitingVersion) === this._currentVersion) {
                this._persistence.delete(this._awaitingInstallerVersionKey);
                this._logger.info('[WindowsAutoUpdater] Currently installed versioned is equal or higher.');
            }
            else {
                if (!this._userTools.isAdmin()) {
                    this._logger.info('[WindowsAutoUpdater] User is not admin, skipping installation.');
                    return false;
                }
                this._logger.info('[WindowsAutoUpdater] Persistence has an awaiting higher installer version saved, installing an update.');
                let pending = this.quitAndInstall();
                if (pending) {
                    electron_1.app.quit();
                }
                return pending;
            }
        }
        return false;
    }
    _runInstaller(updaterLocation) {
        this._logger.info('[WindowsAutoUpdater] Spawning silent updater process ' + updaterLocation);
        childProcess.spawn(updaterLocation, ['/silent', '!desktopicon'], {
            detached: true
        });
    }
    _downloadUpdate(url, version, parsedMetadata) {
        this._logger.info('[WindowsAutoUpdater] starting to download the update from: ' + url);
        this._persistence.delete(this._awaitingInstallerVersionKey);
        this.emit('update-downloading');
        let updateDownloadLocation = path.join(electron_1.app.getPath('userData'), this._installerFileName);
        const updateRequest = this._downloader.getFromUrl(url, updateDownloadLocation);
        updateRequest.on('finished', data => {
            this._logger.info('[WindowsAutoUpdater] update downloaded to: ' + data.body.path);
            this._persistence.set(this._awaitingInstallerVersionKey, version);
            this._emitUpdateDownloadedWithDetails(parsedMetadata);
        });
        updateRequest.on('failed', () => {
            this._logger.info('[WindowsAutoUpdater] error while downloading the update file.');
            this.emit('error');
        });
    }
    _emitUpdateDownloadedWithDetails(parsedMetadata) {
        this.emit('update-downloaded', {}, parsedMetadata.notes, parsedMetadata.name, new Date(parsedMetadata.pub_date), parsedMetadata.url);
    }
}
exports.WindowsAutoUpdater = WindowsAutoUpdater;
