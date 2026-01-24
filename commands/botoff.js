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
  name: "botoff",
  description: "❌ Disable the bot in this group",
  category: "Groupe",
  group: true,      
  admin: false,     
  ownerOnly: true,  

  run: async (sock, m, args) => {
    try {
      const chatId = m.chat;
      let disabledGroups = loadDisabledGroups();

      if (!disabledGroups.includes(chatId)) {
        disabledGroups.push(chatId);
        saveDisabledGroups(disabledGroups);
        global.disabledGroups = new Set(disabledGroups);
      }

      await sock.sendMessage(
        chatId,
        { text: "✅ Bot disabled in this group.\nNo commands, welcome, antilink, or other features will work here." },
        { quoted: m }
      );
    } catch (err) {
      console.error("❌ botoff error:", err);
      await sock.sendMessage(
        m.chat,
        { text: "❌ An error occurred while disabling the bot." },
        { quoted: m }
      );
    }
  }
};