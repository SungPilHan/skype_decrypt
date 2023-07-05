"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const HttpsRequest_1 = require("../HttpsRequest");
const EVENT_PROPERTIES = ['blockedURI', 'documentURI', 'effectiveDirective', 'originalPolicy', 'referrer', 'violatedDirective'];
class CspViolationHandler {
    constructor(configuration, logger) {
        this._reportUri = 'https://edge.skype.com/r/c';
        this._configuration = configuration;
        this._logger = logger;
        this._fakeDocumentUri = `file://${this._configuration.environment}.${this._configuration.appShortName}/`;
    }
    static transformRawEvent(event) {
        let copy = {};
        EVENT_PROPERTIES.forEach(element => {
            if (element in event) {
                copy[element] = event[element];
            }
        });
        return copy;
    }
    handleViolation(violationData) {
        this._logger.warn('[CspViolationHandler] CSP violation: ', violationData);
        let request = new HttpsRequest_1.HttpsRequest({
            method: 'POST',
            url: this._reportUri,
            headers: {
                'Content-Type': 'application/csp-report'
            },
            body: this._getPayload(violationData),
            retryCountLimit: 1
        }, this._logger);
        request.send().then(responseData => {
            this._logger.debug('[CspViolationHandler] Violation report response: ', responseData);
        }).catch(err => {
            this._logger.error('[CspViolationHandler] Violation report failed: ', err);
        });
    }
    _getPayload(violationData) {
        let documentUri = violationData.documentURI && violationData.documentURI !== 'file'
            ? violationData.documentURI : this._fakeDocumentUri;
        let payload = { 'csp-report': {
                'blocked-uri': violationData.blockedURI,
                'document-uri': documentUri,
                'effective-directive': violationData.effectiveDirective,
                'original-policy': violationData.originalPolicy,
                'referrer': violationData.referrer,
                'violated-directive': violationData.violatedDirective
            } };
        return JSON.stringify(payload);
    }
}
exports.CspViolationHandler = CspViolationHandler;
function getInstance() {
    if (electron.remote) {
        return electron.remote.require(__dirname + '/CspViolationHandler').cspViolationHandler;
    }
    else {
        return exports.cspViolationHandler;
    }
}
exports.getInstance = getInstance;
function init(configuration, logger) {
    exports.cspViolationHandler = new CspViolationHandler(configuration, logger);
}
exports.init = init;
