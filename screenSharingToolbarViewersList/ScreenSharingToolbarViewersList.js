var ScreenSharingToolbarViewersList;
(function (ScreenSharingToolbarViewersList) {
    const localisation = window['localisation'];
    const asHTMLElement = (element) => {
        assert(element);
        return element;
    };
    const viewersElement = asHTMLElement(document.getElementById('viewers'));
    const viewerTemplateElement = asHTMLElement(document.getElementById('viewer-template'));
    let focusedViewer;
    const init = () => {
        popupWindowApi.onMessage(onIncomingMessage);
        viewersElement.addEventListener('keydown', onKeyDown, { capture: true });
        document.addEventListener('DOMContentLoaded', () => {
            document.documentElement.lang = localisation.getLanguage();
            document.documentElement.dir = localisation.isLanguageRtl(localisation.getLanguage()) ? 'rtl' : 'ltr';
        });
        sendMessage('initialized');
    };
    const onKeyDown = (e) => {
        if (e.ctrlKey === true || e.altKey === true || e.metaKey === true) {
            return;
        }
        if (e.code === 'Tab') {
            sendMessage('focusChange', e.shiftKey ? 'previous' : 'next');
            e.preventDefault();
            return;
        }
        if (!focusedViewer) {
            return;
        }
        const pageSize = 4;
        if (e.shiftKey === false) {
            switch (e.key) {
                case 'ArrowUp':
                    moveBy('previousElementSibling', 1);
                    break;
                case 'ArrowDown':
                    moveBy('nextElementSibling', 1);
                    break;
                case 'PageUp':
                    moveBy('previousElementSibling', pageSize);
                    break;
                case 'PageDown':
                    moveBy('nextElementSibling', pageSize);
                    break;
                case 'Home':
                    asHTMLElement(viewersElement.firstElementChild).focus();
                    break;
                case 'End':
                    asHTMLElement(viewersElement.lastElementChild).focus();
                    break;
                case 'Escape':
                    sendMessage('hideViewersList');
                    break;
                case ' ':
                case 'Enter':
                    focusedViewer.click();
                    break;
                default:
                    return;
            }
            e.preventDefault();
        }
    };
    const moveBy = (direction, count) => {
        let next = asHTMLElement(focusedViewer);
        for (let i = 0; i !== count; ++i) {
            if (!next[direction]) {
                break;
            }
            next = asHTMLElement(next[direction]);
        }
        next.focus();
    };
    const onIncomingMessage = (name, ...args) => {
        console.debug(`[ScreenSharingViewersList] Received message - name: ${name} args: ${JSON.stringify(args)}`);
        const handler = {
            viewersListModified: onViewersListModified,
            avatarAvailable: avatarAvailable
        };
        if (handler.hasOwnProperty(name)) {
            handler[name](...args);
        }
        else {
            console.error(`[ScreenSharingViewersList] Unhandled message: ${name}`);
        }
    };
    const avatarAvailable = (mri, avatarDataUri) => {
        const viewers = viewersElement.childNodes;
        for (let i = 0; i !== viewers.length; ++i) {
            const childNode = viewers[i];
            if (childNode.nodeType === childNode.ELEMENT_NODE) {
                const viewerElement = viewers[i];
                if (mri === viewerElement.id) {
                    const viewerAvatar = viewerElement.querySelector('img.viewer-avatar');
                    viewerAvatar.src = avatarDataUri;
                }
            }
        }
    };
    const removePreviousViewers = () => {
        while (viewersElement.firstChild) {
            viewersElement.removeChild(viewersElement.firstChild);
        }
    };
    const addCurrentViewers = (viewers) => {
        for (let i = 0; i !== viewers.length; ++i) {
            const viewer = viewers[i];
            const viewerElement = asHTMLElement(viewerTemplateElement.cloneNode(true));
            viewerElement.removeAttribute('id');
            const viewerAvatar = viewerElement.querySelector('img.viewer-avatar');
            const viewerName = viewerElement.querySelector('div.viewer-name');
            viewerAvatar.src = viewer.fallbackAvatarUri;
            viewerName.innerText = viewer.displayName;
            viewerName.title = viewer.displayName;
            viewerElement.id = viewer.username;
            viewerElement.addEventListener('click', () => { sendMessage('grantControl', viewer.username); });
            viewerElement.addEventListener('focus', () => {
                viewerElement.classList.add('focused');
                if (focusedViewer) {
                    focusedViewer.classList.remove('focused');
                }
                focusedViewer = viewerElement;
            });
            viewersElement.appendChild(viewerElement);
        }
    };
    const updateHeight = (height) => {
        console.debug(`[ScreenSharingViewersList] Resizing to ${height}px high`);
        viewersElement.setAttribute('style', `height: ${height}px`);
    };
    const focusFirstElement = () => {
        window.scrollTo(0, 0);
        asHTMLElement(viewersElement.firstElementChild).focus();
    };
    const onViewersListModified = (viewers, height) => {
        removePreviousViewers();
        addCurrentViewers(viewers);
        updateHeight(height);
        focusFirstElement();
    };
    const sendMessage = (name, ...args) => {
        console.debug(`[ScreenSharingViewersList] Sending message - name: ${name} args: ${JSON.stringify(args)}`);
        popupWindowApi.sendMessage(name, ...args);
    };
    init();
})(ScreenSharingToolbarViewersList || (ScreenSharingToolbarViewersList = {}));
