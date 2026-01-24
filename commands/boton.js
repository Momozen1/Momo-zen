import fs from "fs";
import path from "path";

const disabledFile = path.join(process.cwd(), "data/disabledGroups.json");

// Load disabled groups
function loadDisabledGroups() {
  if (!fs.existsSync(disabledFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(disabledFile, "utf-8"));
  } catch {
    return [];
  }
}

// Save disabled groups
function saveDisabledGroups(groups) {
  fs.writeFileSync(disabledFile, JSON.stringify(groups, null, 4));
}

export default {
  name: "boton",
  description: "✅ Reactivate the bot in this group",
  category: "Groupe",
  group: true,      
  admin: false,     
  ownerOnly: true,  

  run: async (sock, m, args) => {
    try {
      const chatId = m.chat;
      let disabledGroups = loadDisabledGroups();

      if (disabledGroups.includes(chatId)) {
        disabledGroups = disabledGroups.filter(id => id !== chatId);
        saveDisabledGroups(disabledGroups);
        global.disabledGroups = new Set(disabledGroups);
      }

      await sock.sendMessage(
        chatId,
        { text: "✅ Bot reactivated in this group.\nAll commands and features are now active." },
        { quoted: m }
      );
    } catch (err) {
      console.error("❌ boton error:", err);
      await sock.sendMessage(
        m.chat,
        { text: "❌ An error occurred while reactivating the bot." },
        { quoted: m }
      );
    }
  }
};