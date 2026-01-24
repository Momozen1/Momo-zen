import fs from "fs";
import path from "path";
import { contextInfo } from "../system/contextInfo.js";

const filePath = path.join(process.cwd(), "data/allPrefix.json");

// Create JSON file if it doesn't exist
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({ enabled: false }, null, 2));
}

// Load JSON
function loadAllPrefix() {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.enabled || false;
  } catch {
    return false;
  }
}

// Save JSON
function saveAllPrefix(state) {
  fs.writeFileSync(filePath, JSON.stringify({ enabled: state }, null, 2));
  global.allPrefix = state; // Update immediately for the handler
  console.log("🌐 AllPrefix Mode:", state ? "Enabled" : "Disabled");
}

// Initialize global.allPrefix
global.allPrefix = loadAllPrefix();

export default {
  name: "allprefix",
  description: "⚙️ Enable or disable Any Prefix mode",
  category: "Owner",
  ownerOnly: true, 

  run: async (sock, m, args) => {
    try {
      const action = args[0]?.toLowerCase();

      // ❌ Invalid usage
      if (!action || !["on", "off"].includes(action)) {
        return sock.sendMessage(
          m.chat,
          {
            text: `⚙️ Usage:\n.allprefix on  → Enable Any Prefix mode\n.allprefix off → Disable Any Prefix mode`,
            contextInfo
          },
          { quoted: m }
        );
      }

      if (action === "on") {
        saveAllPrefix(true);
        return sock.sendMessage(
          m.chat,
          {
            text: `✅ AllPrefix mode enabled!\nThe bot now accepts any prefix or even no prefix.`,
            contextInfo
          },
          { quoted: m }
        );
      } else {
        saveAllPrefix(false);
        return sock.sendMessage(
          m.chat,
          {
            text: `❌ AllPrefix mode disabled.\nThe bot will now only respond to the defined prefix.`,
            contextInfo
          },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ ALLPREFIX ERROR:", err);
      return sock.sendMessage(
        m.chat,
        { text: "❌ An error occurred while toggling AllPrefix mode.", contextInfo },
        { quoted: m }
      );
    }
  }
};