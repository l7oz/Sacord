/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { findByProps } from "@webpack";

let selectedGuilds: string[] = [];
let allGuilds: any[] = [];

const getAutoToken = () => {
    const AuthStore = findByProps("getToken");
    return AuthStore ? AuthStore.getToken() : null;
};

const fetchAllData = async (token: string) => {
    try {
        const res = await fetch("https://discord.com/api/v9/users/@me/guilds", {
            headers: { Authorization: token }
        });
        if (!res.ok) throw new Error("Failed to fetch guilds");
        allGuilds = await res.json();
        renderGuilds();
    } catch (e) {
        console.error("[ServerManager] Error fetching guilds:", e);
    }
};

const renderGuilds = () => {
    const list = document.getElementById("q-guild-list");
    if (!list) return;
    list.innerHTML = "";

    allGuilds.forEach(g => {
        const div = document.createElement("label");
        div.className = "q-guild-item";

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.value = g.id;
        cb.className = "q-checkbox";
        cb.checked = selectedGuilds.includes(g.id);

        cb.onchange = e => {
            if ((e.target as HTMLInputElement).checked) {
                selectedGuilds.push(g.id);
            } else {
                selectedGuilds = selectedGuilds.filter(id => id !== g.id);
            }
            updateLeaveBtn();
        };

        const name = document.createElement("span");
        name.textContent = g.name;

        div.appendChild(cb);
        div.appendChild(name);
        list.appendChild(div);
    });
};

const updateLeaveBtn = () => {
    const btn = document.getElementById("q-ui-leavebtn");
    if (btn) {
        btn.style.display = selectedGuilds.length > 0 ? "block" : "none";
        btn.textContent = `مغادرة (${selectedGuilds.length}) سيرفر`;
    }
};

const showDiscordConfirm = (title: string, description: string, confirmText: string, onConfirm: () => void) => {
    if (document.getElementById("q-modal-backdrop")) return;

    const backdrop = document.createElement("div");
    backdrop.id = "q-modal-backdrop";
    backdrop.innerHTML = `
        <div class="q-modal-content">
            <div class="q-modal-header">${title}</div>
            <div class="q-modal-body">${description}</div>
            <div class="q-modal-footer">
                <button id="q-modal-cancel" class="q-btn-cancel">إلغاء</button>
                <button id="q-modal-confirm" class="q-btn-danger">${confirmText}</button>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);

    document.getElementById("q-modal-cancel")!.onclick = () => backdrop.remove();
    document.getElementById("q-modal-confirm")!.onclick = () => {
        backdrop.remove();
        onConfirm();
    };
};

const CloseUI = () => {
    document.getElementById("quest-float-ui")?.remove();
};

const openUI = () => {
    if (document.getElementById("quest-float-ui")) return;

    const ui = document.createElement("div");
    ui.id = "quest-float-ui";

    ui.innerHTML = `
        <div class="q-header">
            <span>إدارة السيرفرات</span>
            <button id="q-ui-closebtn" class="q-close-icon">✖</button>
        </div>
        <button id="refresh-btn" class="q-btn q-btn-primary">تحديث القائمة</button>
        <div id="q-guild-list">
            <span style="color: #949ba4; display: block; text-align: center; margin-top: 20px;">جاري التحميل...</span>
        </div>
        <button id="q-ui-leavebtn" class="q-btn q-btn-danger" style="display: none; margin-top: 10px;"></button>
    `;

    document.body.appendChild(ui);

    document.getElementById("q-ui-closebtn")!.onclick = () => ui.remove();

    document.getElementById("refresh-btn")!.onclick = () => {
        const token = getAutoToken();
        if (token) fetchAllData(token);
    };

    document.getElementById("q-ui-leavebtn")!.onclick = () => {
        const token = getAutoToken();
        if (!token) return;

        showDiscordConfirm(
            "تأكيد المغادرة",
            `هل أنت متأكد أنك تريد مغادرة <strong>${selectedGuilds.length}</strong> سيرفرات؟ <br><br> <span style="color: #da373c;">لا يمكن التراجع عن هذا الإجراء وسيتم حذفك من هذه السيرفرات نهائياً.</span>`,
            "مغادرة السيرفرات",
            async () => {
                const btn = document.getElementById("q-ui-leavebtn");
                if (btn) {
                    btn.textContent = "جاري المغادرة...";
                    btn.style.pointerEvents = "none";
                    btn.style.opacity = "0.7";
                }

                for (const id of selectedGuilds) {
                    await fetch(`https://discord.com/api/v9/users/@me/guilds/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: token }
                    });
                    await new Promise(r => setTimeout(r, 1200));
                }

                selectedGuilds = [];
                updateLeaveBtn();
                await fetchAllData(token);

                showDiscordConfirm("اكتملت العملية", "تمت مغادرة جميع السيرفرات المحددة بنجاح.", "حسناً", () => { });
            }
        );
    };

    const token = getAutoToken();
    if (token) {
        fetchAllData(token);
    } else {
        const list = document.getElementById("q-guild-list");
        if (list) list.innerHTML = "<span style='color: #da373c; display: block; text-align: center; margin-top: 20px;'>حدث خطأ: لم يتم العثور على التوكن.</span>";
    }
};

export default definePlugin({
    name: "DiscordGuildManager",
    description: "أداة احترافية لمغادرة السيرفرات بتصميم ديسكورد الأصلي وبدون إدخال التوكن يدوياً.",
    authors: [{ name: "Eagle", id: 1135886879372357764n }],

    start() {
        const style = document.createElement("style");
        style.id = "q-guild-manager-styles";
        style.innerHTML = `
            #quest-open-btn {
                position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                background: #2b2d31; color: #dbdee1; padding: 10px 16px;
                border: 1px solid #1e1f22; border-radius: 8px; cursor: pointer;
                font-family: "gg sans", "Noto Sans", sans-serif; font-weight: 600; font-size: 14px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.2); transition: background 0.2s, transform 0.1s;
            }
            #quest-open-btn:hover { background: #5865F2; color: white; }
            #quest-open-btn:active { transform: translateY(2px); }

            #quest-float-ui {
                position: fixed; top: 15%; right: 20px; width: 340px; height: 500px;
                background: #313338; border: 1px solid #1e1f22; border-radius: 8px;
                z-index: 99999; display: flex; flex-direction: column; padding: 16px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.24); font-family: "gg sans", "Noto Sans", sans-serif;
                animation: q-fade-in 0.2s ease-out;
            }

            .q-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; color: #f2f3f5; font-weight: bold; font-size: 16px; }
            .q-close-icon { background: transparent; color: #949ba4; border: none; cursor: pointer; font-size: 14px; transition: color 0.2s; }
            .q-close-icon:hover { color: #da373c; }

            .q-btn { width: 100%; border: none; border-radius: 4px; padding: 10px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s; font-family: "gg sans", "Noto Sans", sans-serif; }
            .q-btn-primary { background: #5865F2; color: white; margin-bottom: 12px; }
            .q-btn-primary:hover { background: #4752c4; }
            .q-btn-danger { background: #da373c; color: white; }
            .q-btn-danger:hover { background: #a12828; }

            #q-guild-list {
                flex: 1; overflow-y: auto; background: #2b2d31; border-radius: 4px;
                padding: 8px; border: 1px solid #1e1f22;
            }
            #q-guild-list::-webkit-scrollbar { width: 8px; }
            #q-guild-list::-webkit-scrollbar-track { background: #2b2d31; border-radius: 4px; }
            #q-guild-list::-webkit-scrollbar-thumb { background: #1a1b1e; border-radius: 4px; }

            .q-guild-item {
                display: flex; align-items: center; gap: 10px; padding: 8px;
                color: #dbdee1; border-radius: 4px; cursor: pointer; font-size: 14px;
                transition: background 0.1s; margin-bottom: 4px;
            }
            .q-guild-item:hover { background: #3f4147; color: #f2f3f5; }
            .q-checkbox { accent-color: #5865F2; width: 16px; height: 16px; cursor: pointer; }

            #q-modal-backdrop {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.7); z-index: 9999999;
                display: flex; align-items: center; justify-content: center;
                backdrop-filter: blur(2px); animation: q-fade-in 0.15s ease-out;
                font-family: "gg sans", "Noto Sans", sans-serif;
            }
            .q-modal-content {
                background: #313338; width: 440px; border-radius: 4px;
                box-shadow: 0 0 0 1px rgba(6,6,7,0.08), 0 2px 10px 0 rgba(6,6,7,0.2);
                overflow: hidden; animation: q-scale-in 0.2s ease-out;
            }
            .q-modal-header { padding: 16px; font-weight: 700; color: #f2f3f5; font-size: 20px; }
            .q-modal-body { padding: 0 16px 16px; color: #dbdee1; font-size: 15px; line-height: 1.4; }
            .q-modal-footer { background: #2b2d31; padding: 16px; display: flex; justify-content: flex-end; gap: 10px; }

            .q-btn-cancel { background: transparent; color: #dbdee1; padding: 10px 24px; border-radius: 3px; border: none; cursor: pointer; font-weight: 600; transition: text-decoration 0.2s; }
            .q-btn-cancel:hover { text-decoration: underline; }

            @keyframes q-fade-in { from { opacity: 0; } to { opacity: 1; } }
            @keyframes q-scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `;
        document.head.appendChild(style);

        const btn = document.createElement("button");
        btn.id = "quest-open-btn";
        btn.innerHTML = "⚙️";
        btn.onclick = () => {
            if (document.getElementById("quest-float-ui")) {
                CloseUI();
            } else {
                openUI();
            }
        };

        document.body.appendChild(btn);
    },

    stop() {
        document.getElementById("quest-open-btn")?.remove();
        document.getElementById("quest-float-ui")?.remove();
        document.getElementById("q-modal-backdrop")?.remove();
        document.getElementById("q-guild-manager-styles")?.remove();
    }
});
