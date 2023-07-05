"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Registry = require("winreg");
const Logger_1 = require("../logger/Logger");
const Platform_1 = require("../tools/Platform");
function restartForUpdate() {
    return new Promise((resolve, reject) => {
        if (!Platform_1.isWindows()) {
            resolve(false);
            return;
        }
        const registry = new Registry({
            hive: Registry.HKCU,
            key: '\\Software\\Microsoft\\Skype'
        });
        const name = 'RestartForUpdate';
        try {
            registry.valueExists(name, (err, result) => {
                if (err) {
                    Logger_1.getInstance().error(`[ReportReboot] Error reading registry key ${registry.key} and name ${name}`, err);
                    resolve(false);
                }
                else {
                    Logger_1.getInstance().info(`[ReportReboot] Reboot was needed for update: ${result}`);
                    if (result) {
                        registry.remove(name, err => {
                            if (err) {
                                Logger_1.getInstance().error('[ReportReboot] Error removing flag', err);
                            }
                            resolve(true);
                        });
                    }
                    else {
                        resolve(false);
                    }
                }
            });
        }
        catch (ignore) {
            Logger_1.getInstance().info('[ReportReboot] Error while reading registry key registry.valueExists()');
            resolve(false);
        }
    });
}
exports.restartForUpdate = restartForUpdate;
