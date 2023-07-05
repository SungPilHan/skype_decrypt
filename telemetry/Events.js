"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const aria_1 = require("../vendor/aria/aria");
const Time_1 = require("../tools/Time");
var PIIKind;
(function (PIIKind) {
    PIIKind[PIIKind["NotSet"] = 0] = "NotSet";
    PIIKind[PIIKind["DistinguishedName"] = 1] = "DistinguishedName";
    PIIKind[PIIKind["GenericData"] = 2] = "GenericData";
    PIIKind[PIIKind["IPV4Address"] = 3] = "IPV4Address";
    PIIKind[PIIKind["IPv6Address"] = 4] = "IPv6Address";
    PIIKind[PIIKind["MailSubject"] = 5] = "MailSubject";
    PIIKind[PIIKind["PhoneNumber"] = 6] = "PhoneNumber";
    PIIKind[PIIKind["QueryString"] = 7] = "QueryString";
    PIIKind[PIIKind["SipAddress"] = 8] = "SipAddress";
    PIIKind[PIIKind["SmtpAddress"] = 9] = "SmtpAddress";
    PIIKind[PIIKind["Identity"] = 10] = "Identity";
    PIIKind[PIIKind["Uri"] = 11] = "Uri";
    PIIKind[PIIKind["Fqdn"] = 12] = "Fqdn";
    PIIKind[PIIKind["IPV4AddressLegacy"] = 13] = "IPV4AddressLegacy";
})(PIIKind = exports.PIIKind || (exports.PIIKind = {}));
class ElectronTelemetryEvent extends aria_1.EventProperties {
    constructor() {
        super();
        this.setProperty('DeviceInfo_OsVersion', os.release());
        this.setProperty('UserInfo.TimeZone', Time_1.getTimezone());
        this.setProperty('DeviceInfo.OsName', os.type());
        this.setProperty('DeviceInfo.OsVersion', os.release());
        this.setProperty('DeviceInfo.OsBuild', os.release());
    }
}
exports.ElectronTelemetryEvent = ElectronTelemetryEvent;
class StartupEvent extends ElectronTelemetryEvent {
    constructor(isAdmin) {
        super();
        this.name = 'client_startup';
        this.setProperty('startup_time', Date.now());
        this.setProperty('is_admin', isAdmin);
    }
}
exports.StartupEvent = StartupEvent;
class DelphiUpgradeEvent extends ElectronTelemetryEvent {
    constructor(action, upgradeDate) {
        super();
        this.name = 'upgraded_from_delphi_to_electron';
        this.setProperty('client_upgraded_from_delphi', action);
        this.setProperty('upgrade_date_from_delphi_to_electron', upgradeDate);
    }
}
exports.DelphiUpgradeEvent = DelphiUpgradeEvent;
class RestartForUpdateEvent extends ElectronTelemetryEvent {
    constructor() {
        super();
        this.name = 'restart_for_update';
    }
}
exports.RestartForUpdateEvent = RestartForUpdateEvent;
class RendererCrashedEvent extends ElectronTelemetryEvent {
    constructor(crashType, isKilled) {
        super();
        this.name = 'renderer_crashed';
        this.setProperty('CrashType', crashType);
        if (isKilled) {
            this.setProperty('IsKilled', isKilled);
        }
    }
}
exports.RendererCrashedEvent = RendererCrashedEvent;
class TrayRightClickEvent extends ElectronTelemetryEvent {
    constructor(actionType) {
        super();
        this.name = 'systray_icon';
        this.setProperty('Action', actionType);
    }
}
exports.TrayRightClickEvent = TrayRightClickEvent;
