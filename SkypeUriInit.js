"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const Logger_1 = require("./logger/Logger");
const SkypeUri_1 = require("./SkypeUri");
let instance;
function buildSkypeUri() {
    if (instance) {
        return instance;
    }
    if (electron.remote) {
        return electron.remote.require(__dirname + '/SkypeUriInit').getInstance();
    }
    else {
        const logger = Logger_1.getInstance();
        return instance = new SkypeUri_1.SkypeUri(logger);
    }
}
exports.getInstance = buildSkypeUri;
