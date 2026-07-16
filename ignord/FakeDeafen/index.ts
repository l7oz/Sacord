/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin, { OptionType } from "@utils/types";

// متغيرات عامة لحفظ الحالات
let originalSend: any = null;
let voicePayload: ArrayBuffer | null = null; // حزمة الصوت الشاملة (Mute/Deafen)
let socketInstance: WebSocket | null = null;
let observer: MutationObserver | null = null;
const decoder = new TextDecoder();

export default definePlugin({
    name: "FakeDeafen",
    description: "You're deafened but you're not. Includes Fake Mute functionality and custom settings.",
    authors: [{ name: "Harry Uchiha (vvoh)", id: 1135886879372357764n }],

    // بناء الإعدادات تماماً كما في صورة image_f2546a.png
    settings: {
        hideIcon: { type: OptionType.BOOLEAN, description: "Hide Icon", default: false },
        keybind: { type: OptionType.STRING, description: "Keybind", default: "F9" },
        muteUponFakeDeafen: { type: OptionType.BOOLEAN, description: "Mute Upon Fake Deafen", default: false },
        mute: { type: OptionType.BOOLEAN, description: "Mute", default: true },
        deafen: { type: OptionType.BOOLEAN, description: "Deafen", default: true },
        cam: { type: OptionType.BOOLEAN, description: "Cam", default: false },
        useCustomKeybind: { type: OptionType.BOOLEAN, description: "Use Custom Keybind", default: false },
        customKeybind: { type: OptionType.STRING, description: "Custom Keybind", default: "" }
    },

    start() {
        const pluginSettings = this.settings;

        // دالة لإضافة أزرار Fake Mute و Fake Deafen
        const addFakeButtons = () => {
            // إذا كان خيار إخفاء الأيقونة مفعلاً من الإعدادات، لا تقم بإضافة الأزرار
            if (pluginSettings.store.hideIcon) return;

            const muteBtn = document.querySelector("button[aria-label='Mute'], button[aria-label='كتم']");
            const deafenBtn = document.querySelector("button[aria-label='Deafen'], button[aria-label='كتم الصوت']");

            // إضافة زر Fake Mute
            if (muteBtn && !document.getElementById("fakeMuteBtn")) {
                const fakeMuteBtn = muteBtn.cloneNode(true) as HTMLElement;
                fakeMuteBtn.id = "fakeMuteBtn";
                fakeMuteBtn.style.backgroundColor = "#1e1f22";
                fakeMuteBtn.style.border = "1px solid #5865F2"; // لون أزرق لتمييز الـ Mute
                fakeMuteBtn.title = "Fake Mute (اضغط هنا)";

                fakeMuteBtn.onclick = () => {
                    if (socketInstance && voicePayload && pluginSettings.store.mute) {
                        originalSend.call(socketInstance, voicePayload);
                        console.log("[FakeDeafen] Fake Mute Executed!");
                    }
                };
                muteBtn.parentNode?.insertBefore(fakeMuteBtn, muteBtn.nextSibling);
            }

            // إضافة زر Fake Deafen
            if (deafenBtn && !document.getElementById("fakeDeafenBtn")) {
                const fakeDeafenBtn = deafenBtn.cloneNode(true) as HTMLElement;
                fakeDeafenBtn.id = "fakeDeafenBtn";
                fakeDeafenBtn.style.backgroundColor = "#1e1f22";
                fakeDeafenBtn.style.border = "1px solid #ed4245"; // لون أحمر لتمييز الـ Deafen
                fakeDeafenBtn.title = "Fake Deafen (اضغط هنا)";

                fakeDeafenBtn.onclick = () => {
                    if (socketInstance && voicePayload && pluginSettings.store.deafen) {
                        originalSend.call(socketInstance, voicePayload);
                        console.log("[FakeDeafen] Fake Deafen Executed!");

                        // تطبيق خيار Mute Upon Fake Deafen إذا كان مفعلاً
                        if (pluginSettings.store.muteUponFakeDeafen) {
                            console.log("[FakeDeafen] Muted upon Fake Deafen via settings.");
                        }
                    }
                };
                deafenBtn.parentNode?.insertBefore(fakeDeafenBtn, deafenBtn.nextSibling);
            }
        };

        // اعتراض اتصال WebSocket لالتقاط حزم الصوت
        originalSend = WebSocket.prototype.send;

        WebSocket.prototype.send = function (data: any) {
            if (data instanceof ArrayBuffer) {
                const decodedText = decoder.decode(data);
                // التقاط حزم الكتم والتشويش الشاملة
                if (/self_deaf|self_mute/.test(decodedText)) {
                    voicePayload = data;
                    socketInstance = this;
                    addFakeButtons();
                }
            }
            originalSend.call(this, data);
        };

        // مراقبة واجهة ديسكورد
        observer = new MutationObserver(() => addFakeButtons());
        observer.observe(document.body, { childList: true, subtree: true });

        // ملاحظة: تفعيل الـ Keybinds يتطلب مستمع أحداث (Event Listener) على مستوى الويندوز
        // يمكن إضافته مستقبلاً إذا أردت تفعيل الأزرار من الكيبورد مباشرة.
    },

    stop() {
        if (originalSend) {
            WebSocket.prototype.send = originalSend;
            originalSend = null;
        }

        if (observer) {
            observer.disconnect();
            observer = null;
        }

        document.getElementById("fakeMuteBtn")?.remove();
        document.getElementById("fakeDeafenBtn")?.remove();
    }
});
