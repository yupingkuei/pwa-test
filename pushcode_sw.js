// 229
"use strict";

class PushCodeSw {
    static version() {
        return "0.1";
    }

    static baseUrl() {
        return "https://event.pushcode.jp/browser/api/v1";
    }

    static toSnakeCase(s) {
        return s
            .replace(/[A-Z]+(?:(?=[A-Z][a-z0-9])|$)/g, ss => ss.charAt(0) + ss.slice(1).toLowerCase())
            .replace(/[A-Z]/g, ss => '_' + ss.charAt(0).toLowerCase());
    }

    static objectToQuery(obj) {
        return Object.keys(obj).map(k => PushCodeSw.toSnakeCase(k) + '=' + encodeURIComponent(obj[k])).join('&')
    }

    static sendEvent(name, pcData) {
        let params = pcData && Object.keys(pcData).length > 0 ? '&' + PushCodeSw.objectToQuery(pcData) : '';
        fetch(PushCodeSw.baseUrl() + '/push_event?type=' + name + params);
    }

    static sendError(log, pcData) {
        if (!pcData) {
            pcData = {};
        }
        pcData.file = 'pushcode_sw.js';
        pcData.v = PushCodeSw.version();
        pcData.log = log;
        PushCodeSw.sendEvent('error', pcData);
    }

    static makeNotificationOptions(msg) {
        let options = {};
        let keys = [
            'dir',
            'lang',
            'body',
            'tag',
            'image',
            'icon',
            'badge',
            'sound',
            'vibrate',
            'timestamp',
            'renotify',
            'silent',
            'requireInteraction',
            'actions'
        ];

        keys.forEach(k => {
            if (typeof msg[k] !== 'undefined') {
                options[k] = msg[k];
            }
        });

        options.data = {};

        if (typeof msg.linkURL !== 'undefined') {
            options.data.url = msg.linkURL;
        }

        if (typeof msg.pcData !== 'undefined') {
            options.data.pcData = msg.pcData;

            if (!options.tag && msg.pcData.pushDraftID) {
                options.tag = msg.pcData.pushDraftID;
            }
        }

        return options;
    }
}

self.addEventListener('install', (e) => {
    e.waitUntil(self.skipWaiting());
    PushCodeSw.sendEvent('install');
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
    PushCodeSw.sendEvent('activate');
});

self.addEventListener('push', (e) => {
    let msg = e.data.json();

    if (!msg || Object.keys(msg) == 0) {
        PushCodeSw.sendError('Empty push message');
        return false;
    }

    if (!msg.title) {
        PushCodeSw.sendError('Empty notification title', msg.pcData)
    }

    let title = msg.title;
    let options = PushCodeSw.makeNotificationOptions(msg);

    e.waitUntil(self.registration.showNotification(title, options));

    PushCodeSw.sendEvent('push', msg.pcData);
});

self.addEventListener('notificationclick', (e) => {
    let data = e.notification.data;

    PushCodeSw.sendEvent('notificationclick', data.pcData);

    e.notification.close();
    if (data.url) {
        e.waitUntil(clients.openWindow(data.url));
    }
});

self.addEventListener('notificationclose', (e) => {
    let data = e.notification.data;
    PushCodeSw.sendEvent('notificationclose', data.pcData);
});

self.addEventListener('fetch', (e) => { });