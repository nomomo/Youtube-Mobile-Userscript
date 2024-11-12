// ==UserScript==
// @name         YouTube Mobile Loop Button
// @namespace    YouTube_Mobile_Loop_Button
// @version      0.0.1
// @description  Adds a loop button to YouTube's mobile site.
// @author       Nomo
// @homepage     https://github.com/nomomo/Youtube-Mobile-Userscript
// @homepageURL  https://github.com/nomomo/Youtube-Mobile-Userscript
// @supportURL   https://github.com/nomomo/Youtube-Mobile-Userscript/issues
// @updateURL    https://github.com/nomomo/Youtube-Modile-Userscript/raw/refs/heads/main/YouTube_Mobile_Loop_Button.user.js
// @downloadURL  https://github.com/nomomo/Youtube-Modile-Userscript/raw/refs/heads/main/YouTube_Mobile_Loop_Button.user.js
// @match        *://m.youtube.com/*
// @require      https://cdn.jsdelivr.net/npm/arrive@2.4.1/minified/arrive.min.js
// @grant        unsafeWindow
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Constants for frequently used selectors
    const SELECTORS = {
        ACTION_BAR: ".slim-video-action-bar-actions",
        LOOP_BUTTON: ".loop-button",
        VIDEO: "video",
        REPLAY_BUTTON: ".endscreen-replay-button",
        ACTION_BAR_CONTAINER: "ytm-slim-video-action-bar-renderer"
    };

    const debug = false;
    let isLoopEnabled = false;

    function debugLog(message) {
        if (debug) console.log(message);
    }

    GM_addStyle(`
        .loop-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 18px;
            padding: 5px 12px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.3s, color 0.3s;
            margin: 8px 16px;
        }
        .loop-button.not-looping {
            background-color: #e0e0e0;
            color: #333;
        }
        .loop-button.looping {
            background-color: #1565c0;
            color: white;
        }
        .loop-button svg {
            margin-right: 5px;
            width: 16px;
            height: 16px;
            fill: currentColor;
        }
    `);

    function createLoopIcon() {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", "M13 3c4.97 0 9 4.03 9 9h-1.5c0-4.14-3.36-7.5-7.5-7.5S5.5 7.86 5.5 12H10l-4 4-4-4h3.5c0-5.52 4.48-10 10-10zm-2 18c-4.97 0-9-4.03-9-9h1.5c0 4.14 3.36 7.5 7.5 7.5s7.5-3.36 7.5-7.5H14l4-4 4 4h-3.5c0 5.52-4.48 10-10 10z");
        svg.appendChild(path);
        return svg;
    }

    function toggleLoopSetting(loopButton) {
        isLoopEnabled = !isLoopEnabled;
        loopButton.classList.toggle("looping", isLoopEnabled);
        loopButton.classList.toggle("not-looping", !isLoopEnabled);
        loopButton.querySelector("span").textContent = isLoopEnabled ? "Loop On" : "Loop Off";
    }

    function createLoopButton(actionBarContainer) {
        const existingLoopButton = document.querySelector(SELECTORS.LOOP_BUTTON);
        if (existingLoopButton) return;

        const loopButton = document.createElement("button");
        loopButton.classList.add("loop-button", isLoopEnabled ? "looping" : "not-looping");

        const loopIcon = createLoopIcon();
        loopButton.appendChild(loopIcon);

        const buttonText = document.createElement("span");
        buttonText.textContent = isLoopEnabled ? "Loop On" : "Loop Off";
        loopButton.appendChild(buttonText);

        loopButton.addEventListener("click", () => {
            toggleLoopSetting(loopButton);
            applyLoopToVideo();
        });

        // Insert the loop button before the action bar container
        actionBarContainer.parentNode.insertBefore(loopButton, actionBarContainer);
        debugLog("Loop button added before action bar container");
    }

    function applyLoopToVideo() {
        const video = document.querySelector(SELECTORS.VIDEO);
        if (video) video.loop = isLoopEnabled;
    }

    function setupAutoReplay(video) {
        document.arrive(SELECTORS.REPLAY_BUTTON, () => {
            if (isLoopEnabled) {
                video.currentTime = 0;
                video.play();
            }
        });
    }

    document.leave(SELECTORS.LOOP_BUTTON, () => {
        const actionBarContainer = document.querySelector(SELECTORS.ACTION_BAR_CONTAINER);
        if (actionBarContainer) {
            debugLog("Re-inserting loop button before action bar container.");
            createLoopButton(actionBarContainer);
        }
    });

    document.arrive(SELECTORS.ACTION_BAR_CONTAINER, function () {
        createLoopButton(this);
    });

    document.arrive(SELECTORS.VIDEO, function () {
        const actionBarContainer = document.querySelector(SELECTORS.ACTION_BAR_CONTAINER);
        if (actionBarContainer) {
            setTimeout(() => createLoopButton(actionBarContainer), 100);
        }

        const video = this;
        video.loop = isLoopEnabled;
        unsafeWindow.videoElement = video;
        setupAutoReplay(video);

        video.addEventListener("remove", () => {
            unsafeWindow.videoElement = null;
        });
    });
})();
