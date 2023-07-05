"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OUTLINE_WIDTH = 2;
const KEY_CODE_TAB = 9;
const KEY_CODE_ESC = 27;
class KeyboardNavigationEvent {
    constructor() {
        this._callbacks = [];
        this._onMouseDownCapture = (e) => {
            this._updateKeyboardNavigationState(false);
        };
        this._onKeyDownCapture = (e) => {
            if (e.keyCode === KEY_CODE_TAB) {
                this._updateKeyboardNavigationState(true);
            }
            if (e.keyCode === KEY_CODE_ESC) {
                const activeElement = document.activeElement;
                if (this._isNavigatingWithKeyboardUpateTimer) {
                    window.clearTimeout(this._isNavigatingWithKeyboardUpateTimer);
                }
                this._isNavigatingWithKeyboardUpateTimer = window.setTimeout(() => {
                    this._isNavigatingWithKeyboardUpateTimer = undefined;
                    if ((document.activeElement === activeElement) && activeElement && (activeElement !== document.body)) {
                        this._updateKeyboardNavigationState(false);
                    }
                }, 200);
            }
        };
    }
    subscribe(callback) {
        if (!this._handlersReady) {
            window.addEventListener('keydown', this._onKeyDownCapture, true);
            window.addEventListener('mousedown', this._onMouseDownCapture, true);
        }
        this._callbacks.push(callback);
    }
    unsubscribe(callback) {
        this._callbacks = this._callbacks.filter(cb => cb !== callback);
    }
    _updateKeyboardNavigationState(isNavigatingWithKeyboard) {
        if (this._isNavigatingWithKeyboardUpateTimer) {
            window.clearTimeout(this._isNavigatingWithKeyboardUpateTimer);
            this._isNavigatingWithKeyboardUpateTimer = undefined;
        }
        if (this._isNavigatingWithKeyboard !== isNavigatingWithKeyboard) {
            this._isNavigatingWithKeyboard = isNavigatingWithKeyboard;
            this._callbacks.forEach(callback => callback(isNavigatingWithKeyboard));
        }
    }
}
exports.KeyboardNavigationEvent = KeyboardNavigationEvent;
const outlineContainerStyles = {
    display: 'none',
    position: 'absolute',
    background: '#ff4500',
    width: 0,
    height: 0,
    left: 0,
    top: 0,
    zIndex: 100500
};
const refs = {
    container: 'container',
    left: 'left',
    top: 'top',
    right: 'right',
    bottom: 'bottom'
};
const outlineBorderStyles = {
    left: {
        position: 'absolute',
        background: 'inherit',
        width: OUTLINE_WIDTH + 'px',
        height: OUTLINE_WIDTH + 'px',
        borderTopLeftRadius: OUTLINE_WIDTH + 'px',
        borderBottomLeftRadius: OUTLINE_WIDTH + 'px'
    },
    top: {
        position: 'absolute',
        background: 'inherit',
        width: OUTLINE_WIDTH + 'px',
        height: OUTLINE_WIDTH + 'px',
        borderTopLeftRadius: OUTLINE_WIDTH + 'px',
        borderTopRightRadius: OUTLINE_WIDTH + 'px'
    },
    right: {
        position: 'absolute',
        background: 'inherit',
        width: OUTLINE_WIDTH + 'px',
        height: OUTLINE_WIDTH + 'px',
        borderTopRightRadius: OUTLINE_WIDTH + 'px',
        borderBottomRightRadius: OUTLINE_WIDTH + 'px'
    },
    bottom: {
        position: 'absolute',
        background: 'inherit',
        width: OUTLINE_WIDTH + 'px',
        height: OUTLINE_WIDTH + 'px',
        borderBottomLeftRadius: OUTLINE_WIDTH + 'px',
        borderBottomRightRadius: OUTLINE_WIDTH + 'px'
    }
};
let _nativeOutlineDisabler;
function _toggleNativeOutline(noOutline) {
    if (typeof document !== 'undefined') {
        if (noOutline && !_nativeOutlineDisabler) {
            const disableNativeOutline = '*:focus { outline: none; }';
            _nativeOutlineDisabler = document.createElement('style');
            _nativeOutlineDisabler.type = 'text/css';
            _nativeOutlineDisabler.appendChild(document.createTextNode(disableNativeOutline));
            document.head.appendChild(_nativeOutlineDisabler);
        }
        else if (!noOutline && _nativeOutlineDisabler) {
            document.head.removeChild(_nativeOutlineDisabler);
            _nativeOutlineDisabler = undefined;
        }
    }
}
function _isEqual(a, b) {
    if (typeof a !== typeof b) {
        return false;
    }
    if (a instanceof Array && b instanceof Array) {
        if (a.length !== b.length) {
            return false;
        }
        return a.every((val, index) => val === b[index]);
    }
    else if ((typeof a === 'object') && (a !== null) && (b !== null)) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        return aKeys.every(key => (key in b) && _isEqual(a[key], b[key]));
    }
    return a === b;
}
function _clone(obj) {
    let ret;
    if (obj instanceof Array) {
        ret = [];
        ret.push.apply(ret, obj);
    }
    else if ((typeof obj === 'object') && (obj !== null)) {
        ret = {};
        Object.keys(obj).forEach(key => ret[key] = _clone(obj[key]));
    }
    else {
        ret = obj;
    }
    return ret;
}
class FocusOutline {
    constructor(keyboardNavigationEvent, outlineContainer) {
        this._onFocusIn = (e) => {
            if (!this._isNavigatingWithKeyboard) {
                return;
            }
            if (this._displayTimer) {
                window.clearTimeout(this._displayTimer);
                this._displayTimer = undefined;
            }
            const focusedElement = (e && e.target);
            if (focusedElement.tagName === 'INPUT' || focusedElement.tagName === 'TEXTAREA') {
                return;
            }
            this._displayTimer = window.setTimeout(() => {
                this._focusedElement = focusedElement;
                const updateOutlinePositionIfNeeded = () => {
                    this._setOutlinePosition();
                    this._displayTimer = window.setTimeout(updateOutlinePositionIfNeeded, 30);
                };
                updateOutlinePositionIfNeeded();
            }, 30);
        };
        this._onFocusOut = () => {
            if (this._displayTimer) {
                window.clearTimeout(this._displayTimer);
                this._displayTimer = undefined;
            }
            this._focusedElement = undefined;
            this._setOutlinePosition();
        };
        this._onKeyboardNavigationStateChanged = (isNavigatingWithKeyboard) => {
            this._isNavigatingWithKeyboard = isNavigatingWithKeyboard;
            if (isNavigatingWithKeyboard) {
            }
            else {
                this._onFocusOut();
            }
        };
        this._onScroll = (e) => {
            if (this._isNavigatingWithKeyboard && !this._updateAnimationFrame) {
                this._updateAnimationFrame = window.requestAnimationFrame(() => {
                    this._updateAnimationFrame = undefined;
                    this._setOutlinePosition();
                });
            }
        };
        this._keyboardNavigationEvent = keyboardNavigationEvent;
        this._outlineContainer = outlineContainer || document.body;
        _toggleNativeOutline(true);
        document.addEventListener('focusin', this._onFocusIn, true);
        document.addEventListener('focusout', this._onFocusOut, true);
        window.addEventListener('scroll', this._onScroll, true);
        this._render();
        this._keyboardNavigationEvent.subscribe(this._onKeyboardNavigationStateChanged);
    }
    dispose() {
        if (this._nodes) {
            this._outlineContainer.removeChild(this._nodes.container);
            this._nodes = undefined;
        }
        this._keyboardNavigationEvent.unsubscribe(this._onKeyboardNavigationStateChanged);
        document.removeEventListener('focusin', this._onFocusIn, true);
        document.removeEventListener('focusout', this._onFocusOut, true);
        window.removeEventListener('scroll', this._onScroll, true);
        _toggleNativeOutline(false);
    }
    _render() {
        if (this._nodes) {
            return;
        }
        const container = document.createElement('div');
        const left = document.createElement('div');
        const top = document.createElement('div');
        const right = document.createElement('div');
        const bottom = document.createElement('div');
        [[container, outlineContainerStyles],
            [left, outlineBorderStyles.left],
            [top, outlineBorderStyles.top],
            [right, outlineBorderStyles.right],
            [bottom, outlineBorderStyles.bottom]].forEach((nodeAndStyle) => {
            const [node, style] = nodeAndStyle;
            Object.keys(style).forEach(prop => {
                node.style[prop] = style[prop];
            });
        });
        container.appendChild(left);
        container.appendChild(top);
        container.appendChild(right);
        container.appendChild(bottom);
        this._outlineContainer.appendChild(container);
        this._nodes = {
            container: container,
            left: left,
            top: top,
            right: right,
            bottom: bottom
        };
    }
    _setOutlinePosition() {
        let position;
        let boundingRect = this._focusedElement && this._focusedElement.getBoundingClientRect();
        if (boundingRect) {
            position = {
                left: boundingRect.left,
                top: boundingRect.top,
                right: boundingRect.right,
                bottom: boundingRect.bottom
            };
        }
        if (_isEqual(position, this._currentPosition)) {
            return;
        }
        let container = this._nodes && this._nodes.container;
        if (!container || !container.parentElement) {
            return;
        }
        this._currentPosition = position;
        if (position && this._focusedElement) {
            let pos = _clone(position);
            for (let parent = this._focusedElement.parentElement; parent; parent = parent.parentElement) {
                if (parent.clientWidth === 0 || parent.clientHeight === 0) {
                    continue;
                }
                boundingRect = parent.getBoundingClientRect();
                if (boundingRect.left > pos.left) {
                    pos.left = boundingRect.left;
                }
                if (boundingRect.top > pos.top) {
                    pos.top = boundingRect.top;
                }
                if (boundingRect.right < pos.right) {
                    pos.right = boundingRect.right;
                }
                if (boundingRect.bottom < pos.bottom) {
                    pos.bottom = boundingRect.bottom;
                }
            }
            const windowWidth = container.parentElement.clientWidth;
            const windowHeight = container.parentElement.clientHeight;
            pos.left = pos.left > OUTLINE_WIDTH ? pos.left - OUTLINE_WIDTH : 0;
            pos.top = pos.top > OUTLINE_WIDTH ? pos.top - OUTLINE_WIDTH : 0;
            pos.right = pos.right < windowWidth - OUTLINE_WIDTH ? pos.right + OUTLINE_WIDTH : windowWidth;
            pos.bottom = pos.bottom < windowHeight - OUTLINE_WIDTH ? pos.bottom + OUTLINE_WIDTH : windowHeight;
            const width = pos.right - pos.left;
            const height = pos.bottom - pos.top;
            if (this._nodes && width > OUTLINE_WIDTH + OUTLINE_WIDTH && height > OUTLINE_WIDTH + OUTLINE_WIDTH) {
                let leftBorderNode = this._nodes.left;
                let topBorderNode = this._nodes.top;
                let rightBorderNode = this._nodes.right;
                let bottomBorderNode = this._nodes.bottom;
                if (!leftBorderNode || !topBorderNode || !rightBorderNode || !bottomBorderNode) {
                    return;
                }
                leftBorderNode.style.left =
                    topBorderNode.style.left =
                        bottomBorderNode.style.left = pos.left + 'px';
                rightBorderNode.style.left = (pos.left + width - OUTLINE_WIDTH) + 'px';
                leftBorderNode.style.top =
                    rightBorderNode.style.top =
                        topBorderNode.style.top = pos.top + 'px';
                bottomBorderNode.style.top = (pos.top + height - OUTLINE_WIDTH) + 'px';
                leftBorderNode.style.height =
                    rightBorderNode.style.height = height + 'px';
                topBorderNode.style.width =
                    bottomBorderNode.style.width = width + 'px';
                container.style.display = 'block';
                return;
            }
        }
        container.style.display = 'none';
    }
}
exports.FocusOutline = FocusOutline;
