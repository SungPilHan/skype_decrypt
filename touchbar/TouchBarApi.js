"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron = require("electron");
const path = require("path");
class TouchBarApi {
    constructor(window) {
        this._window = window;
    }
    setTouchBarApi(touchBar) {
        let items = [];
        touchBar.items.forEach(touchBarElement => {
            let touchBarElmnt = this._createTouchBarObject(touchBarElement);
            if (touchBarElmnt) {
                items.push(touchBarElmnt);
            }
        });
        let touchBarElectron = new electron.TouchBar({ items: items });
        if (touchBar.escapeItem !== null) {
            touchBarElectron.escapeItem = this._createTouchBarObject(touchBar.escapeItem);
        }
        this._window.setTouchBar(touchBarElectron);
    }
    _createTouchBarObject(touchBarElement) {
        switch (touchBarElement.kind) {
            case 'button':
                let touchBarButtonOptions = {
                    label: touchBarElement.label || undefined,
                    backgroundColor: touchBarElement.backgroundColor || undefined,
                    iconPosition: touchBarElement.iconPosition || undefined,
                    click: () => {
                        if (touchBarElement.click) {
                            this._window.webContents.send(touchBarElement.click);
                        }
                    }
                };
                if (touchBarElement.icon) {
                    touchBarButtonOptions['icon'] = this._createNativeImage(touchBarElement.icon);
                }
                let touchBarButton = new electron.TouchBar.TouchBarButton(touchBarButtonOptions);
                return touchBarButton;
            case 'label':
                let touchBarLabel = new electron.TouchBar.TouchBarLabel({
                    label: touchBarElement.label || undefined,
                    textColor: touchBarElement.textColor || undefined
                });
                return touchBarLabel;
            case 'spacer':
                let touchBarSpacer = new electron.TouchBar.TouchBarSpacer({
                    size: touchBarElement.size || undefined
                });
                return touchBarSpacer;
            case 'popover':
                let touchBarPopoverOptions = {
                    label: touchBarElement.label || undefined,
                    showCloseButton: touchBarElement.showCloseButton || true
                };
                if (touchBarElement.icon) {
                    touchBarPopoverOptions['icon'] = this._createNativeImage(touchBarElement.icon);
                }
                if (touchBarElement.items && touchBarElement.items.items.length > 0) {
                    let popoverItems = touchBarElement.items.items;
                    let popoverElectronItems = [];
                    popoverItems.forEach(popoverElement => {
                        let popoverItem = this._createTouchBarObject(popoverElement);
                        if (popoverItem) {
                            popoverElectronItems.push(popoverItem);
                        }
                    });
                    touchBarPopoverOptions['items'] = new electron.TouchBar({ items: popoverElectronItems });
                }
                let touchBarPopover = new electron.TouchBar.TouchBarPopover(touchBarPopoverOptions);
                return touchBarPopover;
            case 'scrubber':
                let scrubberItems = [];
                touchBarElement.items.forEach(scrubberElement => {
                    let options = {
                        label: scrubberElement.label || undefined
                    };
                    if (scrubberElement.icon) {
                        options['icon'] = this._createNativeImage(scrubberElement.icon);
                    }
                    scrubberItems.push(options);
                });
                let touchBarScrubber = new electron.TouchBar.TouchBarScrubber({
                    items: scrubberItems,
                    select: (selectedElement) => {
                        this._window.webContents.send(touchBarElement.select, selectedElement);
                    },
                    highlight: (highlightedElement) => {
                        this._window.webContents.send(touchBarElement.highlight, highlightedElement);
                    },
                    selectedStyle: touchBarElement.selectedStyle,
                    overlayStyle: (touchBarElement.overlayStyle || null),
                    showArrowButtons: touchBarElement.showArrowButtons || false,
                    mode: touchBarElement.mode || 'free',
                    continuous: touchBarElement.continous || true
                });
                return touchBarScrubber;
        }
        return null;
    }
    _createNativeImage(image) {
        let icon = path.join(__dirname, '..', image);
        return electron.nativeImage.createFromPath(icon);
    }
}
exports.TouchBarApi = TouchBarApi;
