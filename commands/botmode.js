import { contextInfo } from "../system/contextInfo.js";

export default {
  name: "private",
  description: "🔒 Enable or disable bot private mode (owner only)",
  category: "Owner",
  ownerOnly: true, // ✅ Managed by handler

  run: async (sock, m, args) => {
    try {
      const action = args[0]?.toLowerCase();
      if (!action || !["on", "off"].includes(action)) {
        return sock.sendMessage(
          m.chat,
          { text: "🔒 Usage:\n.private on\n.private off", contextInfo },
          { quoted: m }
        );
      }

      if (action === "on") {
        global.privateMode = true;
        return sock.sendMessage(
          m.chat,
          { text: "✅ *Private mode enabled*: only owner commands are accepted.", contextInfo },
          { quoted: m }
        );
      } else {
        global.privateMode = false;
        return sock.sendMessage(
          m.chat,
          { text: "❌ *Private mode disabled*: everyone can use commands.", contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error("❌ private.js error:", err);
      return sock.sendMessage(
        m.chat,
        { text: "❌ An error occurred while toggling private mode.", contextInfo },
        { quoted: m }
      );
    }
  }
};