import config, { saveConfig } from "../config.js";
import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "blockinbox",
  description: "Block or allow bot private messages",
  category: "Owner",
  ownerOnly: true, // ✅ Managed by handler

  run: async (kaya, m, args) => {
    try {
      const action = args[0]?.toLowerCase();

      if (!["on", "off", "status"].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          {
            text:
`🔒 *Block Inbox*

Usage:
.blockinbox on
.blockinbox off
.blockinbox status

📌 Function:
Prevents the bot from replying in private.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      // Initialize if needed
      global.blockInbox = global.blockInbox ?? config.blockInbox ?? false;

      if (action === "on") {
        global.blockInbox = true;
        saveConfig({ blockInbox: true });

        return kaya.sendMessage(
          m.chat,
          {
            text: "🚫 *Private messages blocked*\n\nThe bot will no longer reply in private.\n➡️ Only allowed in groups.",
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "off") {
        global.blockInbox = false;
        saveConfig({ blockInbox: false });

        return kaya.sendMessage(
          m.chat,
          {
            text: "✅ *Private messages allowed*\n\nThe bot can reply in private again.",
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "status") {
        return kaya.sendMessage(
          m.chat,
          {
            text: `🔒 *Block Inbox*\n\nStatus: ${
              global.blockInbox ? "🚫 ENABLED" : "✅ DISABLED"
            }`,
            contextInfo
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ blockinbox error:", err);
    }
  }
};