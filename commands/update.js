// ==================== commands/update.js ====================
import { exec } from "child_process";

export default {
  name: "update",
  description: "Met à jour le bot depuis GitHub",
  category: "Owner",
  ownerOnly: true,

  run: async (kaya, m) => {

    // 🔐 Sécurité owner absolue
    if (!m.fromMe) return;

    await kaya.sendMessage(
      m.chat,
      { text: "🔄 *Mise à jour en cours depuis GitHub...*" },
      { quoted: m }
    );

    exec("git pull origin main && npm install --omit=dev", async (err, stdout, stderr) => {
      if (err) {
        return kaya.sendMessage(
          m.chat,
          { text: "❌ *Erreur lors de la mise à jour :*\n\n" + err.message },
          { quoted: m }
        );
      }

      await kaya.sendMessage(
        m.chat,
        {
          text:
`✅ *Mise à jour terminée avec succès*

📦 Changements appliqués
♻️ Redémarrage du bot en cours...`
        },
        { quoted: m }
      );

      // 🔁 Redémarrage automatique
      process.exit(0);
    });
  }
};