"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aria_1 = require("../vendor/aria/aria");
const Events_1 = require("./Events");
const LinuxDistro_1 = require("./LinuxDistro");
class TelemetryLoggerImpl {
    constructor(configuration, clientVersion, deviceInfo, language) {
        this._isSnap = false;
        this._linuxDistro = LinuxDistro_1.getPrettyName();
        if (this._linuxDistro) {
            this._isSnap = 'SNAP' in process.env && process.env['SNAP'] ? true : false;
        }
        this._configuration = configuration;
        if (!aria_1.LogManager.isInitialized()) {
            aria_1.LogManager.initialize(configuration.tenantToken);
        }
        this._clientVersion = clientVersion;
        this._deviceInfo = deviceInfo;
        this._language = language;
        this._logger = new aria_1.Logger(configuration.tenantToken);
    }
    setUserId(userId) {
        this._userId = userId;
    }
    setEcsConfig(ecsConfig) {
        this._ecsConfig = ecsConfig;
    }
    log(properties) {
        if (this._userId) {
            properties.setProperty('Skype_InitiatingUser_Username', this._userId, Events_1.PIIKind.Identity);
        }
        if (this._ecsConfig && this._ecsConfig.hasData()) {
            const { etag } = this._ecsConfig.getData();
            properties.setProperty('ETag', etag);
        }
        properties.setProperty('Client_Name', this._configuration.appShortName);
        properties.setProperty('AppInfo.AppName', this._configuration.appShortName);
        properties.setProperty('Platform_Uiversion', this._clientVersion.getFullVersion());
        properties.setProperty('Platform_Id', this._clientVersion.getPlatform());
        properties.setProperty('AppInfo.Version', this._clientVersion.getVersion());
        properties.setProperty('DeviceInfo.Id', this._deviceInfo.getId());
        properties.setProperty('DeviceInfo.Locale', this._language.getDetectedSystemLocale());
        properties.setProperty('AppInfo.Language', this._language.getLanguage());
        properties.setProperty('UserInfo.Language', this._language.getLanguage());
        properties.setProperty('UserInfo.Locale', this._language.getLocale());
        if (this._linuxDistro) {
            properties.setProperty('DeviceInfo.LinuxDistro', this._linuxDistro);
            properties.setProperty('DeviceInfo.IsSnap', this._isSnap ? 'true' : 'false');
        }
        this._logger.logEvent(properties);
    }
}
exports.TelemetryLoggerImpl = TelemetryLoggerImpl;
