"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = require("path");
const AuthStore_1 = require("../login/AuthStore");
const constants = require("../Constants");
const Events_1 = require("../telemetry/Events");
const LanguageInit_1 = require("../localisation/LanguageInit");
const platform = require("../tools/Platform");
const PresenceStatus_1 = require("../presence/PresenceStatus");
const TelemetryLoggerInit_1 = require("../telemetry/TelemetryLoggerInit");
const _baseTrayIconFolder = 'images/tray';
class SkypeTray {
    constructor(app, configuration, ecsConfig) {
        this._trayStatus = PresenceStatus_1.PresenceStatus.Offline;
        this._trayBadgeCount = 0;
        this._application = app;
        this._authStore = AuthStore_1.getInstance();
        this._localisation = LanguageInit_1.language;
        this._configuration = configuration;
        this._ecsConfig = ecsConfig;
        if (this._ecsConfig) {
            this._ecsConfig.on('ecs-data-ready', () => {
                this.initTrayMenu();
            });
            this._ecsConfig.on('ecs-data-changed', () => {
                this.initTrayMenu();
            });
        }
        this._tray = new electron_1.Tray(this._getTrayIconInternal());
        this.initTrayMenu();
        electron_1.ipcMain.on('badgeCount', (event, count) => {
            this.setBadgeCount(count);
        });
        if (!platform.isMac()) {
            this._tray.on('click', () => {
                let window = this._application.getMainWindow();
                if (window) {
                    window.showAndFocus();
                }
            });
        }
    }
    initTrayMenu() {
        this._trayBaseToolTip = this._localisation.getString(this._configuration.appNameKey);
        this._trayContentMenuArray = [
            {
                label: this._localisation.getString('TrayIcon.OnlineStatusLabel'),
                type: 'submenu',
                submenu: [
                    {
                        label: this._localisation.getString('TrayIcon.OnlineLabel'),
                        enabled: this._presenceItemEnabled(PresenceStatus_1.PresenceStatus.Online),
                        icon: this._getMenuStatusIcon(PresenceStatus_1.PresenceStatus.Online),
                        click: () => {
                            this._updatePresenceStatus(PresenceStatus_1.PresenceStatus.Online);
                        }
                    },
                    {
                        label: this._localisation.getString('TrayIcon.AwayLabel'),
                        enabled: this._presenceItemEnabled(PresenceStatus_1.PresenceStatus.Away),
                        icon: this._getMenuStatusIcon(PresenceStatus_1.PresenceStatus.Away),
                        visible: this._enableNewPresence(),
                        click: () => {
                            this._updatePresenceStatus(PresenceStatus_1.PresenceStatus.Away);
                        }
                    },
                    {
                        label: this._localisation.getString('TrayIcon.DoNotDisturbLabel'),
                        enabled: this._presenceItemEnabled(PresenceStatus_1.PresenceStatus.Busy),
                        icon: this._getMenuStatusIcon(PresenceStatus_1.PresenceStatus.Busy),
                        click: () => {
                            this._updatePresenceStatus(PresenceStatus_1.PresenceStatus.Busy);
                        }
                    },
                    {
                        label: this._localisation.getString('TrayIcon.InvisibleLabel'),
                        enabled: this._presenceItemEnabled(PresenceStatus_1.PresenceStatus.Hidden),
                        icon: this._getMenuStatusIcon(PresenceStatus_1.PresenceStatus.Hidden),
                        click: () => {
                            this._updatePresenceStatus(PresenceStatus_1.PresenceStatus.Hidden);
                        }
                    }
                ]
            },
            {
                label: this._localisation.getString('TrayIcon.OpenSkypeLabel'),
                click: () => {
                    TelemetryLoggerInit_1.telemetryLogger.log(new Events_1.TrayRightClickEvent('Open Skype'));
                    let window = this._application.getMainWindow();
                    if (window) {
                        window.showAndFocus();
                    }
                }
            },
            {
                type: 'separator'
            },
            {
                label: this._localisation.getString('TrayIcon.SignOutLabel'),
                enabled: this._authStore.isAuthenticated(),
                click: () => {
                    TelemetryLoggerInit_1.telemetryLogger.log(new Events_1.TrayRightClickEvent('Sign Out'));
                    electron_1.app.emit('menu-event', 'menu-sign-out');
                }
            },
            {
                type: 'separator'
            },
            {
                label: this._localisation.getString('TrayIcon.QuitSkypeLabel'),
                click: () => {
                    this._application.quit();
                }
            },
        ];
        this._updateTray();
    }
    setBadgeCount(count = 0) {
        this._trayBadgeCount = count;
        this._updateTray();
    }
    setStatus(status) {
        this._trayStatus = status.toLowerCase();
        this.initTrayMenu();
        this._updateTray();
    }
    getStatus() {
        return this._trayStatus;
    }
    getTooltip() {
        return this._trayToolTip;
    }
    getTrayIcon() {
        return this._trayIconPath;
    }
    displayBalloon(title, content) {
        this._tray.displayBalloon({ title: title, content: content });
    }
    _presenceItemEnabled(itemStatus) {
        return this._trayStatus !== PresenceStatus_1.PresenceStatus.Offline && this._trayStatus !== itemStatus;
    }
    _updatePresenceStatus(presence) {
        TelemetryLoggerInit_1.telemetryLogger.log(new Events_1.TrayRightClickEvent('Change Presence'));
        let window = this._application.getMainWindow();
        if (window && window.hasValidWindow()) {
            window.webContents.send('presence-change', presence);
        }
    }
    _updateTray() {
        this._trayToolTip = this._getTooltipInternal();
        this._tray.setImage(this._getTrayIconInternal());
        this._tray.setToolTip(this._trayToolTip);
        this._tray.setContextMenu(this._getMenu());
    }
    _getTooltipInternal() {
        if (this._enableNewPresence()) {
            const unReadMessageLabel = this._trayBadgeCount ?
                this._localisation.getString('TrayIcon.UnreadMessageLabel', { messageCount: this._trayBadgeCount }) : '';
            let statusLabel;
            switch (this._trayStatus) {
                case PresenceStatus_1.PresenceStatus.Offline:
                    return this._localisation.getString('TrayIcon.SingedOutStatusLabel');
                case PresenceStatus_1.PresenceStatus.Online:
                    statusLabel = this._localisation.getString('TrayIcon.OnlineLabel');
                    break;
                case PresenceStatus_1.PresenceStatus.Hidden:
                    statusLabel = this._localisation.getString('TrayIcon.InvisibleLabel');
                    break;
                case PresenceStatus_1.PresenceStatus.Busy:
                    statusLabel = this._localisation.getString('TrayIcon.DoNotDisturbLabel');
                    break;
                case PresenceStatus_1.PresenceStatus.Away:
                    statusLabel = this._localisation.getString('TrayIcon.AwayLabel');
                    break;
            }
            if (statusLabel) {
                return this._localisation.getString('TrayIcon.SingedInStatusLabel', { status: statusLabel })
                    + '\r\n\r\n' + unReadMessageLabel;
            }
        }
        return `${this._trayBaseToolTip}`;
    }
    static getTrayIconByStatusAndBadge(status, count = 0, enableNewPresence) {
        const platformName = platform.isMac() ? 'mac' : platform.isWindows() ? 'win' : 'linux';
        const hiDPISuffix = platform.isMac() ? '@2x' : '';
        const extension = platform.isWindows() ? 'ico' : 'png';
        const badge = (enableNewPresence || platform.isMac() || status === PresenceStatus_1.PresenceStatus.Offline || count === 0) ? ''
            : 'Unread';
        const basePath = enableNewPresence ? `${_baseTrayIconFolder}/${platformName}/newIcons`
            : `${_baseTrayIconFolder}/${platformName}`;
        if (status === PresenceStatus_1.PresenceStatus.Hidden) {
            status = enableNewPresence ? PresenceStatus_1.PresenceStatus.Hidden : PresenceStatus_1.PresenceStatus.Offline;
        }
        const iconPath = `${basePath}/tray-${status}${badge}Template${hiDPISuffix}.${extension}`;
        return path.join(constants.rootDir, iconPath);
    }
    _getMenuStatusIcon(status) {
        const iconPath = `${_baseTrayIconFolder}/presence/dot-${status}.png`;
        return electron_1.nativeImage.createFromPath(path.join(constants.rootDir, iconPath));
    }
    _getTrayIconInternal() {
        return electron_1.nativeImage.createFromPath(SkypeTray.getTrayIconByStatusAndBadge(this._trayStatus, this._trayBadgeCount, this._enableNewPresence()));
    }
    _getMenu() {
        const menu = electron_1.Menu.buildFromTemplate(this._trayContentMenuArray);
        return menu;
    }
    _enableNewPresence() {
        const ecsData = this._ecsConfig ? this._ecsConfig.getData() : undefined;
        return ecsData ? ecsData.enableNewPresenceMode : false;
    }
}
exports.SkypeTray = SkypeTray;
