"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
const Platform_1 = require("./tools/Platform");
const app = electron.remote ? electron.remote.app : electron.app;
exports.protocol = 'file://';
exports.applicationUrl = exports.protocol + '/Index.html';
exports.appDataDir = app.getPath('userData');
exports.rootDir = __dirname;
exports.translationsDir = path.join(__dirname, 'translations');
exports.appUserModelId = 'Microsoft.Skype.SkypeDesktop';
exports.logCloseTimeout = 3000;
const tpnFilename = 'third-party_attributions.html';
exports.thirdPartyNoticesFile = Platform_1.pickByPlatform(path.join(path.dirname(app.getPath('exe')), tpnFilename), path.join(path.dirname(app.getPath('exe')), '..', 'Resources', tpnFilename), path.join('SNAP' in process.env && process.env['SNAP'] ? '' + process.env['SNAP'] : '', `/usr/share/doc/skypeforlinux/${tpnFilename}`));
exports.ecsPath = '/config/v1/SkypeElectronWrapper/#PLATFORM#_#VERSION#?ConfigOption=#CONFIG_OPTION#&clientId=#CLIENT_ID#';
exports.ecsRetryGetIn = 5000;
exports.ecsRetryFailedIn = 300;
exports.ecsRefreshInterval = 1000 * 60 * 60 * 2;