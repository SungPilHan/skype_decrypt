"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const _ = require("lodash");
const { Menu, MenuItem } = electron_1.remote;
class RendererContextMenu {
    showContextMenu(menuOptions, options) {
        if (options) {
            const zoomFactor = electron_1.webFrame.getZoomFactor();
            if (zoomFactor !== 1) {
                options.x = !_.isUndefined(options.x) ? Math.floor(options.x * zoomFactor) : undefined;
                options.y = !_.isUndefined(options.y) ? Math.floor(options.y * zoomFactor) : undefined;
            }
        }
        let menu = new Menu();
        const groups = _.groupBy(menuOptions, option => option.group);
        const groupIds = _.keys(groups).sort();
        _.each(groupIds, (group, index) => {
            _.each(groups[group], option => {
                menu.append(new MenuItem({
                    type: option.type,
                    label: option.text,
                    checked: option.checked,
                    enabled: !option.disabled,
                    accelerator: option.accelerator,
                    click: () => {
                        option.onClick();
                    }
                }));
            });
            if (index < (groupIds.length - 1)) {
                menu.append(new MenuItem({ type: 'separator' }));
            }
        });
        const popupOptions = Object.assign({}, options);
        menu.popup(popupOptions);
        menu = undefined;
    }
}
exports.RendererContextMenu = RendererContextMenu;
