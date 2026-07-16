/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";

export default definePlugin({
    name: "BetterMicrophoneasd",
    description: "Eagle Test",
    // استخدمنا معرفاً حقيقياً لتجنب انهيار واجهة ديسكورد عند جلب صورة المطور
    authors: [{ name: "Harry Uchiha (vvoh)", id: 1135886879372357764n }],

    start() {
        console.log("[BetterMicrophone] الهيكل الأساسي يعمل بنجاح!");
    },

    stop() {
        console.log("[BetterMicrophone] تم إيقاف الإضافة.");
    }
});
