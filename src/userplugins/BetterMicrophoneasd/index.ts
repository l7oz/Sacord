// /*
//  * Vencord, a Discord client mod
//  * Copyright (c) 2026 Vendicated and contributors
//  * SPDX-License-Identifier: GPL-3.0-or-later
//  */

// import { definePluginSettings } from "@api/Settings";
// import definePlugin, { OptionType } from "@utils/types";

// // 1. بناء الإعدادات باستخدام الأداة الآمنة لمنع انهيار الواجهة
// export const settings = definePluginSettings({
//     bitrateStatus: { type: OptionType.BOOLEAN, description: "Audio Bitrate Status (تفعيل تغيير جودة الصوت)", default: true },
//     bitrateLevel: {
//         type: OptionType.SELECT,
//         description: "Audio Bitrate Level (مستوى الجودة)",
//         options: [
//             { label: "High (أعلى جودة - 384kbps)", value: "High" },
//             { label: "Medium (جودة متوسطة - 128kbps)", value: "Medium" },
//             { label: "Low (جودة منخفضة - 64kbps)", value: "Low" }
//         ],
//         default: "High"
//     },
//     stereoStatus: { type: OptionType.BOOLEAN, description: "Stereo Status (تفعيل الصوت المحيطي)", default: true },
//     simpleMode: { type: OptionType.BOOLEAN, description: "Simple Mode", default: true }
// });

// let originalSetLocalDescription: any = null;

// export default definePlugin({
//     name: "BetterMicrophone",
//     description: "تحسين جودة الصوت بشكل احترافي مع إمكانية تفعيل Stereo وضبط Audio Bitrate.",
//     authors: [{ name: "Eagle", id: 1135886879372357764n }],

//     // 2. ربط الإعدادات الآمنة بالإضافة
//     settings,

//     start() {
//         const pluginSettings = this.settings;
//         originalSetLocalDescription = window.RTCPeerConnection.prototype.setLocalDescription;

//         // 3. كود تعديل الصوت المحمي (Try-Catch)
//         window.RTCPeerConnection.prototype.setLocalDescription = function (description: any, ...args: any[]) {
//             try {
//                 if (description && typeof description.sdp === "string" && (description.type === "answer" || description.type === "offer")) {
//                     let modifiedSdp = description.sdp;

//                     // تفعيل وضع Stereo
//                     if (pluginSettings.store.stereoStatus && modifiedSdp.includes("opus/48000/2")) {
//                         modifiedSdp = modifiedSdp.replace(/(a=fmtp:\d+ .*)/g, "$1; stereo=1; sprop-stereo=1");
//                     }

//                     // تفعيل وضبط الـ Audio Bitrate
//                     if (pluginSettings.store.bitrateStatus) {
//                         let bitrate = 384000; // High
//                         if (pluginSettings.store.bitrateLevel === "Medium") bitrate = 128000;
//                         if (pluginSettings.store.bitrateLevel === "Low") bitrate = 64000;

//                         modifiedSdp = modifiedSdp.replace(/(a=fmtp:\d+ .*)/g, `$1; maxaveragebitrate=${bitrate}`);
//                         modifiedSdp = modifiedSdp.replace(/b=AS:\d+/g, `b=AS:${Math.round(bitrate / 1000)}`);
//                     }

//                     // استخدام كائن WebRTC آمن
//                     const safeDescription = new RTCSessionDescription({
//                         type: description.type,
//                         sdp: modifiedSdp
//                     });

//                     return originalSetLocalDescription.call(this, safeDescription, ...args);
//                 }
//             } catch (error) {
//                 console.error("[BetterMicrophone] SDP Modification Error:", error);
//             }

//             return originalSetLocalDescription.call(this, description, ...args);
//         };
//     },

//     stop() {
//         if (originalSetLocalDescription) {
//             window.RTCPeerConnection.prototype.setLocalDescription = originalSetLocalDescription;
//             originalSetLocalDescription = null;
//         }
//     }
// });
