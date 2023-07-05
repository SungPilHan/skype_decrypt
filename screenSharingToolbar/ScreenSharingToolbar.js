var ScreenSharingToolbar;
(function (ScreenSharingToolbar) {
    const localisation = window['localisation'];
    const domLocaliser = window['domLocaliser'];
    const electronRemote = window['electron'].remote;
    const electronScreen = window['electron'].screen;
    const avatars = {};
    function asHTMLElement(element) {
        assert(element);
        return element;
    }
    const listener = asHTMLElement(document.getElementById('listener'));
    const minimizedRestoreRegion = asHTMLElement(document.getElementById('minimized_restore_region'));
    const toolbar = asHTMLElement(document.getElementById('toolbar'));
    const avatar = asHTMLElement(document.getElementById('avatar'));
    const sharingStatusLabel = asHTMLElement(document.getElementById('sharing_status'));
    const grantControlButton = asHTMLElement(document.getElementById('grant_control_button'));
    const acceptControlButton = asHTMLElement(document.getElementById('accept_control_button'));
    const denyControlButton = asHTMLElement(document.getElementById('deny_control_button'));
    const terminateControlButton = asHTMLElement(document.getElementById('terminate_control_button'));
    const stopButton = asHTMLElement(document.getElementById('stop_button'));
    const grantControlSection = asHTMLElement(document.getElementById('grant_control_section'));
    const controlRequestedSection = asHTMLElement(document.getElementById('control_requested_section'));
    const terminateControlSection = asHTMLElement(document.getElementById('terminate_control_section'));
    const stopButtonSection = asHTMLElement(document.getElementById('stop_button_section'));
    let hideTimer;
    let checkHasMouseLeftTimer;
    let viewerWithControl;
    let viewerRequestingControl;
    let hasViewersWithControlCapability = false;
    let toolbarHasFocus = false;
    let toolbarHasMouse = false;
    let viewersListShown = false;
    let sharingStatusText = '';
    let sharingType = 'screen';
    let initialHideTimer = {
        timer: undefined,
        hideWhenDone: true
    };
    const init = () => {
        sharingStatusText = locStrings.SharingStatusScreen();
        const observingEventOptions = { capture: true, passive: true };
        toolbar.addEventListener('focus', handleToolbarFocus, observingEventOptions);
        toolbar.addEventListener('blur', handleToolbarBlur, observingEventOptions);
        listener.addEventListener('mouseenter', handleMouseEnter);
        listener.addEventListener('mouseleave', handleMouseLeave);
        listener.addEventListener('mousemove', handleMouseMove);
        stopButton.addEventListener('click', handleStopButton);
        grantControlButton.addEventListener('click', handleGrantControlButton);
        acceptControlButton.addEventListener('click', handleAcceptControl);
        denyControlButton.addEventListener('click', handleDenyControl);
        terminateControlButton.addEventListener('click', handleTerminateControl);
        screenSharingToolbarApi.onMessage(onIncomingMessage);
        updateUi();
        document.addEventListener('DOMContentLoaded', () => {
            domLocaliser.translateDomElement(document.body);
            document.documentElement.lang = localisation.getLanguage();
            document.documentElement.dir = localisation.isLanguageRtl(localisation.getLanguage()) ? 'rtl' : 'ltr';
        });
        showToolbar();
        startInitialHideTimer();
        sendMessage('initialized');
    };
    const onIncomingMessage = (name, ...args) => {
        console.debug(`[ScreenSharingToolbar] Received message - name: ${name} args: ${JSON.stringify(args)}`);
        const handler = {
            sharingType: onSharingType,
            hasViewersChanged: onHasViewersChanged,
            viewerRequestingControl: onViewerRequestingControl,
            viewerControlling: onViewerControlling,
            viewersListHidden: onViewersListHidden,
            focusChangeFromViewersList: onFocusChangeFromViewersWithControlCapability,
            restore: showToolbar,
            avatarAvailable: avatarAvailable
        };
        if (handler.hasOwnProperty(name)) {
            handler[name](...args);
        }
        else {
            console.error(`[ScreenSharingToolbar] Unhandled message: ${name}`);
        }
    };
    const avatarAvailable = (mri, avatarDataUri) => {
        avatars[mri] = avatarDataUri;
        updateUi();
    };
    const onSharingType = (type) => {
        sharingType = type;
        sharingStatusText = locStrings.SharingStatusScreen();
    };
    const onFocusChangeFromViewersWithControlCapability = (direction) => {
        stopButton.focus();
    };
    const getLocStringForViewer = (locKey, viewer) => {
        const locParam = { viewer_display_name: viewer.displayName };
        return localisation.getString(locKey, locParam);
    };
    const locStrings = {
        SharingStatusScreen: () => localisation.getString((sharingType === 'screen')
            ? 'ScreenSharingToolbar.SharingStatusScreen'
            : 'ScreenSharingToolbar.SharingStatusWindow'),
        RequestingControlStatus: (viewer) => getLocStringForViewer('ScreenSharingToolbar.RequestingControlStatus', viewer),
        AcceptControlTooltip: (viewer) => getLocStringForViewer('ScreenSharingToolbar.AcceptControlTooltip', viewer),
        DenyControlTooltip: (viewer) => getLocStringForViewer('ScreenSharingToolbar.DenyControlTooltip', viewer),
        SharingControlStatus: (viewer) => getLocStringForViewer('ScreenSharingToolbar.SharingControlStatus', viewer),
        TerminateControlTooltip: (viewer) => getLocStringForViewer('ScreenSharingToolbar.TerminateControlTooltip', viewer),
    };
    const updateUi = () => {
        if (viewerRequestingControl) {
            const label = locStrings.RequestingControlStatus(viewerRequestingControl);
            sharingStatusLabel.innerText = label;
            sharingStatusLabel.title = label;
            acceptControlButton.title = locStrings.AcceptControlTooltip(viewerRequestingControl);
            denyControlButton.title = locStrings.DenyControlTooltip(viewerRequestingControl);
            const realAvatarUri = avatars[viewerRequestingControl.username];
            avatar.src = realAvatarUri ? realAvatarUri : viewerRequestingControl.fallbackAvatarUri;
            showControl(avatar);
            showControl(controlRequestedSection);
            hideControl(grantControlSection);
            hideViewersList();
            hideControl(terminateControlSection);
            hideControl(stopButtonSection);
        }
        else if (viewerWithControl) {
            const label = locStrings.SharingControlStatus(viewerWithControl);
            sharingStatusLabel.innerText = label;
            sharingStatusLabel.title = label;
            terminateControlButton.title = locStrings.TerminateControlTooltip(viewerWithControl);
            const realAvatarUri = avatars[viewerWithControl.username];
            avatar.src = realAvatarUri ? realAvatarUri : viewerWithControl.fallbackAvatarUri;
            showControl(avatar);
            showControl(terminateControlSection);
            hideControl(grantControlSection);
            hideViewersList();
            hideControl(controlRequestedSection);
            showControl(stopButtonSection);
        }
        else if (hasViewersWithControlCapability === true) {
            sharingStatusLabel.innerText = sharingStatusText;
            sharingStatusLabel.title = sharingStatusText;
            hideControl(avatar);
            showControl(grantControlSection);
            hideControl(controlRequestedSection);
            hideControl(terminateControlSection);
            showControl(stopButtonSection);
        }
        else {
            sharingStatusLabel.innerText = sharingStatusText;
            sharingStatusLabel.title = sharingStatusText;
            hideControl(avatar);
            hideControl(grantControlSection);
            hideViewersList();
            hideControl(controlRequestedSection);
            hideControl(terminateControlSection);
            showControl(stopButtonSection);
        }
    };
    const hideControl = (control) => {
        control.classList.add('hidden');
    };
    const showControl = (control) => {
        control.classList.remove('hidden');
    };
    const onHasViewersChanged = (value) => {
        hasViewersWithControlCapability = value;
        updateUi();
    };
    const onViewerRequestingControl = (viewer) => {
        viewerRequestingControl = viewer;
        if (viewerRequestingControl) {
            showToolbar();
            sendMessage('announce', locStrings.RequestingControlStatus(viewerRequestingControl));
        }
        else {
            sendMessage('announce', locStrings.SharingStatusScreen());
            if (!hideTimer && !toolbarHasFocus && !toolbarHasMouse) {
                startHideTimer(1000);
            }
        }
        updateUi();
    };
    const onViewerControlling = (viewer) => {
        viewerWithControl = viewer;
        if (viewerWithControl) {
            sendMessage('announce', locStrings.SharingControlStatus(viewerWithControl));
        }
        else {
            sendMessage('announce', locStrings.SharingStatusScreen());
        }
        updateUi();
    };
    const handleStopButton = (e) => {
        sendMessage('sharingStop');
    };
    const isHidden = () => {
        return toolbar.classList.contains('hidden');
    };
    const showToolbar = () => {
        minimizedRestoreRegion.classList.add('show-restore-region');
        showControl(toolbar);
        sendMessage('restore');
        clearHideTimer();
    };
    const hideToolbar = () => {
        minimizedRestoreRegion.classList.remove('show-restore-region');
        hideControl(toolbar);
        sendMessage('minimize');
    };
    const handleToolbarFocus = (e) => {
        toolbarHasFocus = true;
        onToolbarGainsFocus();
    };
    const handleMouseEnter = (e) => {
        toolbarHasMouse = true;
        startCheckHasMouseLeftTimer();
        onToolbarGainsFocus();
    };
    const onToolbarGainsFocus = () => {
        if (isHidden()) {
            showToolbar();
        }
        clearHideTimer();
    };
    const handleToolbarBlur = (e) => {
        toolbarHasFocus = false;
        onToolbarLostFocus(1000);
    };
    const handleMouseLeave = (e) => {
        toolbarHasMouse = false;
        clearCheckHasMouseLeftTimer();
        onToolbarLostFocus(1000);
    };
    const onToolbarLostFocus = (timeout) => {
        if (!viewerRequestingControl && !toolbarHasFocus && !toolbarHasMouse && !viewersListShown) {
            startHideTimer(timeout);
        }
    };
    const clearHideTimer = () => {
        initialHideTimer.hideWhenDone = false;
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = undefined;
        }
    };
    const startInitialHideTimer = () => {
        const initialTimeoutInMs = 7000;
        initialHideTimer.timer = setTimeout(() => {
            initialHideTimer.timer = undefined;
            if (initialHideTimer.hideWhenDone && !isHidden()) {
                hideToolbar();
            }
        }, initialTimeoutInMs);
    };
    const clearInitialHideTimer = () => {
        if (initialHideTimer.timer) {
            clearTimeout(initialHideTimer.timer);
            initialHideTimer.timer = undefined;
        }
    };
    const startHideTimer = (timeout) => {
        clearHideTimer();
        hideTimer = setTimeout(() => {
            if (initialHideTimer.timer) {
                initialHideTimer.hideWhenDone = true;
            }
            else if (!isHidden()) {
                hideToolbar();
            }
        }, timeout);
    };
    const contains = (region, point) => {
        if (point.x < region.x || (region.x + region.width) < point.x) {
            return false;
        }
        if (point.y < region.y || (region.y + region.height) < point.y) {
            return false;
        }
        return true;
    };
    const isMouseCaptured = () => {
        const currentWindow = electronRemote.getCurrentWindow();
        const systemMouseLocation = electronScreen.getCursorScreenPoint();
        const currentWindowBounds = currentWindow.getBounds();
        return contains(currentWindowBounds, systemMouseLocation);
    };
    const clearCheckHasMouseLeftTimer = () => {
        if (checkHasMouseLeftTimer) {
            clearTimeout(checkHasMouseLeftTimer);
            checkHasMouseLeftTimer = undefined;
        }
    };
    const startCheckHasMouseLeftTimer = () => {
        checkHasMouseLeftTimer = setTimeout(() => {
            if (isMouseCaptured()) {
                toolbarHasMouse = true;
                startCheckHasMouseLeftTimer();
            }
            else {
                assert(toolbarHasMouse);
                if (toolbarHasMouse) {
                    toolbarHasMouse = false;
                    onToolbarLostFocus(0);
                }
            }
        }, 1000);
    };
    const handleMouseMove = (e) => {
        if (!toolbarHasMouse) {
            handleMouseEnter(e);
        }
        clearCheckHasMouseLeftTimer();
        startCheckHasMouseLeftTimer();
    };
    const handleGrantControlButton = (e) => {
        if (viewersListShown) {
            hideViewersList();
        }
        else {
            showViewersList();
        }
    };
    const showViewersList = () => {
        viewersListShown = true;
        sendMessage('showViewersList', grantControlButton.offsetLeft);
        clearInitialHideTimer();
        clearHideTimer();
    };
    const hideViewersList = () => {
        sendMessage('hideViewersList');
    };
    const onViewersListHidden = () => {
        console.info(`[ScreenSharingToolbar] onViewersListHidden`);
        viewersListShown = false;
        onToolbarLostFocus(1000);
    };
    const handleAcceptControl = (e) => {
        clearInitialHideTimer();
        if (viewerRequestingControl) {
            sendMessage('acceptControlRequest', viewerRequestingControl.username);
        }
        else {
            console.error(`[ScreenSharingToolbar] handleAcceptControl should not be called unless there is a viewer requesting control`);
        }
    };
    const handleDenyControl = (e) => {
        clearInitialHideTimer();
        if (viewerRequestingControl) {
            sendMessage('denyControlRequest', viewerRequestingControl.username);
        }
        else {
            console.error(`[ScreenSharingToolbar] handleDenyControl should not be called unless there is a viewer requesting control`);
        }
    };
    const handleTerminateControl = (e) => {
        if (viewerWithControl) {
            sendMessage('terminateControl', viewerWithControl.username);
        }
        else {
            console.error(`[ScreenSharingToolbar] terminateControl should not be called unless there is a viewer with control`);
        }
    };
    const sendMessage = (name, ...args) => {
        console.debug(`[ScreenSharingToolbar] Sending message - name: ${name} args: ${JSON.stringify(args)}`);
        screenSharingToolbarApi.sendMessage(name, ...args);
    };
    init();
})(ScreenSharingToolbar || (ScreenSharingToolbar = {}));
