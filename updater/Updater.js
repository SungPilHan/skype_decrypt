"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const querystring = require("querystring");
const CachedPublisher_1 = require("../CachedPublisher");
const FallbackLogger_1 = require("./fallback_dependencies/FallbackLogger");
const LinuxAutoUpdater_1 = require("./LinuxAutoUpdater");
const PackageInfo_1 = require("../configuration/PackageInfo");
const platform = require("../tools/Platform");
const Settings_1 = require("../Settings");
const UpdateEventType_1 = require("./UpdateEventType");
const WindowsAutoUpdater_1 = require("./WindowsAutoUpdater");
class Updater extends CachedPublisher_1.CachedPublisher {
    constructor(logger, ecsConfig, appConfig, clientVersion, persistence, downloader, userTools) {
        super();
        this._updateInterval = 0;
        this._isCheckingOrDownloadingUpdates = false;
        this._explicitCheck = true;
        this._updateInitiated = false;
        if (logger) {
            this._logger = logger;
        }
        else {
            this._logger = new FallbackLogger_1.FallbackLogger();
            this._logger.info('[Updater] initialized with fallback logger.');
        }
        if (ecsConfig) {
            this._logger.info('[Updater] initialized with an ECS config provider.');
            this._ecsConfig = ecsConfig;
        }
        this._appConfig = appConfig;
        if (persistence) {
            this._persistence = persistence;
        }
        else {
            this._persistence = new Map();
            this._logger.info('[Updater] initialized with fallback persistence.');
        }
        this._clientVersion = clientVersion;
        this._downloader = downloader;
        this._userTools = userTools;
        if (platform.isMac()) {
            this._autoUpdater = electron.remote ? electron.remote.autoUpdater : electron.autoUpdater;
        }
        else if (platform.isWindows()) {
            this._autoUpdater = new WindowsAutoUpdater_1.WindowsAutoUpdater(this._logger, this._appConfig, this._persistence, this._clientVersion, this._downloader, this._userTools);
        }
        else {
            this._autoUpdater = new LinuxAutoUpdater_1.LinuxAutoUpdater(this._logger, this._ecsConfig, this._clientVersion);
        }
        this._registerAutoUpdaterEvents();
        this._registerEcsUpdate();
        this._logger.info('[Updater] initialized.');
    }
    start() {
        this._logger.info('[Updater] start() called.');
        if (this.updatesEnabled()) {
            let config;
            if (this._ecsConfig) {
                config = this._ecsConfig.getData();
            }
            this._updateInterval = config && config.updateInterval ? config.updateInterval : Updater.DEFAULT_UPDATE_INTERVAL;
            this._logger.info('[Updater] Update interval set to', this._updateInterval);
            this._logger.info('[Updater] Starting unexplicit update check as the updater was started.');
            this.checkForUpdates(false);
            this._startPeriodicChecks();
        }
        else {
            this._logger.info('[Updater] Updates disabled.');
        }
    }
    checkForUpdates(explicit = true) {
        if (!this.updatesEnabled()) {
            return;
        }
        this._explicitCheck = explicit;
        this._logger.info(`[Updater] Checking for updates, explicit check: ${explicit}`);
        if (this._isCheckingOrDownloadingUpdates) {
            this._logger.info('[Updater] Checking for updates already in progress');
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.CheckingForUpdates, this._explicitCheck);
            return;
        }
        let feedUrl = this._getUpdateFeedUrl();
        if (!feedUrl && !platform.isLinux()) {
            return;
        }
        this._setSemaphore();
        this._logger.info('[Updater] Setting update feed url to: ' + feedUrl);
        this._autoUpdater.setFeedURL({ url: feedUrl });
        this._autoUpdater.checkForUpdates();
    }
    updatesEnabled() {
        return this._appConfig.enableUpdates;
    }
    quitAndInstall() {
        if (this._updateInitiated) {
            return;
        }
        this._updateInitiated = true;
        this._logger.info('[Updater] got quit and install command');
        this.emitEvent(Updater.INSTALL_UPDATE);
    }
    installUpdate() {
        if (platform.isLinux()) {
            return;
        }
        this._logger.info('[Updater] Actually running the update installation');
        this._autoUpdater.quitAndInstall();
    }
    installWindowsMandatoryUpdatesIfPresent() {
        if (platform.isWindows() && this._appConfig.enableUpdates) {
            return this._autoUpdater.installMandatoryUpdatesIfPresent();
        }
        return false;
    }
    _getUpdateFeedUrl() {
        let config;
        if (this._ecsConfig) {
            config = this._ecsConfig.getData();
        }
        let updaterFeedUrl;
        if (config) {
            updaterFeedUrl = config.platformUpdaterFeedUrl;
        }
        if (!updaterFeedUrl) {
            this._logger.info('[Updater] Platform updater feed URL not set.');
            let fallbackUrl = this._appConfig.fallbackUpdaterFeedUrl;
            if (fallbackUrl) {
                updaterFeedUrl = fallbackUrl;
            }
            else {
                this._logger.info('[Updater] Fallback platform updater feed URL not set. Breaking a check for updates');
                return undefined;
            }
        }
        return updaterFeedUrl + '?' + this._getQueryString();
    }
    _registerAutoUpdaterEvents() {
        if (!this._autoUpdater) {
            return;
        }
        this._autoUpdater.on('checking-for-update', () => {
            this._logger.info('[Updater] Checking for update.');
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.CheckingForUpdates, this._explicitCheck);
        });
        this._autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, releaseDate, updateURL) => {
            const updateDetails = {
                releaseName,
                releaseNotes,
                releaseDate,
                updateURL
            };
            this._logger.info('[Updater] Update downloaded.', updateDetails);
            this._resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.UpdateDownloaded, this._explicitCheck, updateDetails);
        });
        this._autoUpdater.on('update-available', () => {
            this._logger.info('[Updater] Update available.');
            this._setSemaphore(3 * 60 * 1000);
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.UpdateAvailable, this._explicitCheck);
        });
        this._autoUpdater.on('update-not-available', () => {
            this._logger.info('[Updater] Update not found.');
            this._resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.NoUpdateAvailable, this._explicitCheck);
        });
        this._autoUpdater.on('error', (error) => {
            this._logger.info('[Updater] There was an error when updating: ' +
                (error !== undefined && error.message !== undefined ? error.message : error));
            this._resetSemaphore();
            this.emitEvent(Updater.UPDATE_RESULT, UpdateEventType_1.UpdateEventType.Error, this._explicitCheck);
        });
    }
    _registerEcsUpdate() {
        if (this._ecsConfig && this._autoUpdater) {
            this._ecsConfig.on('ecs-data-ready', () => {
                this._handleEcsUpdate();
            });
            this._ecsConfig.on('ecs-data-changed', () => {
                this._handleEcsUpdate();
            });
        }
    }
    _handleEcsUpdate() {
        let config = this._ecsConfig.getData();
        if (config) {
            if (config.enableNonAdminDetection !== this._persistence.get(Settings_1.SettingsKeys.CheckNonAdminUser, false)) {
                this._logger.info(`[Updater] Non Admin user startup check enabled: ${config.enableNonAdminDetection}`);
                this._persistence.set(Settings_1.SettingsKeys.CheckNonAdminUser, config.enableNonAdminDetection);
            }
        }
        if (!this.updatesEnabled()) {
            return;
        }
        let _updateInterval = config && config.updateInterval ? config.updateInterval : Updater.DEFAULT_UPDATE_INTERVAL;
        if (this._updateInterval !== _updateInterval) {
            this._updateInterval = _updateInterval;
            this._logger.info(`[Updater] Update interval set to ${this._updateInterval}, rescheduling update checks`);
            if (this._updateTimer) {
                clearInterval(this._updateTimer);
                this._updateTimer = undefined;
                this._startPeriodicChecks();
            }
        }
    }
    _startPeriodicChecks() {
        if (!this._updateTimer) {
            this._logger.debug(`[Updater] Calling startPeriodicChecks with interval ${this._updateInterval}`);
            let callback = () => { this.checkForUpdates(false); };
            this._updateTimer = setInterval(callback, this._updateInterval);
        }
    }
    _setSemaphore(timeout = 30 * 1000) {
        this._isCheckingOrDownloadingUpdates = true;
        if (this._checkingForUpdatesTimeout) {
            clearTimeout(this._checkingForUpdatesTimeout);
        }
        this._checkingForUpdatesTimeout = setTimeout(() => { this._resetSemaphore(); }, timeout);
    }
    _resetSemaphore() {
        this._isCheckingOrDownloadingUpdates = false;
        if (this._checkingForUpdatesTimeout) {
            clearTimeout(this._checkingForUpdatesTimeout);
            this._checkingForUpdatesTimeout = undefined;
        }
    }
    _getQueryString() {
        return querystring.stringify({
            'version': this._clientVersion,
            'os': platform.getPlatformShortCode(),
            'ring': PackageInfo_1.readPackageJson().getData().buildChannel,
            'app': PackageInfo_1.readPackageJson().getData().app,
            't': Date.now(),
            'osversion': platform.getOSVersion()
        });
    }
}
Updater.DEFAULT_UPDATE_INTERVAL = 4 * 60 * 60 * 1000;
Updater.UPDATE_RESULT = 'update-result';
Updater.INSTALL_UPDATE = 'install-update';
exports.Updater = Updater;
let updater;
exports.default = updater;
function init(logger, ecsConfig, appConfig, clientVersion, persistence, downloader, userTools) {
    updater = new Updater(logger, ecsConfig, appConfig, clientVersion.getVersion(), persistence, downloader, userTools);
}
exports.init = init;
