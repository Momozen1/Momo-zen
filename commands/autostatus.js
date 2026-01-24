import { contextInfo } from '../system/contextInfo.js';

export default {
  name: 'autostatus',
  description: 'Activer/désactiver la vue automatique des statuts et envoi au DM owner',
  category: 'Owner',
  ownerOnly: true,

  run: async (kaya, m, args) => {
    try {
      const action = args[0]?.toLowerCase();
      if (!['on', 'off', 'status'].includes(action)) {
        return kaya.sendMessage(
          m.chat,
          {
            text:
`👁️ *Auto Status*

Usage :
.autostatus on
.autostatus off
.autostatus status

📌 Fonction :
Le bot regarde automatiquement les statuts et les envoie à l'owner.`,
            contextInfo
          },
          { quoted: m }
        );
      }

      global.autoStatus = global.autoStatus ?? false;

      // ✅ ON
      if (action === 'on') {
        global.autoStatus = true;

        // 🔹 Lancer le listener si pas déjà lancé
        if (!global.autoStatusListenerAttached) {
          global.autoStatusListenerAttached = true;
          const ownerNumber = kaya.user.id.split(":")[0] + "@s.whatsapp.net";

          kaya.ev.on('stories.update', async (updates) => {
            if (!global.autoStatus) return;

            for (const update of updates) {
              try {
                const key = update.key;
                const msg = update.message;
                if (!msg) continue;

                const sender = key.participant || key.remoteJid;

                // Marquer comme vu
                await kaya.sendReadReceipt(key.remoteJid, sender, [key.id]);

                // Envoyer au DM owner
                if (msg.imageMessage) {
                  await kaya.sendMessage(ownerNumber, {
                    image: { url: msg.imageMessage },
                    caption: `👁️ Statut de @${sender.split("@")[0]}`,
                    mentions: [sender]
                  });
                } else if (msg.videoMessage) {
                  await kaya.sendMessage(ownerNumber, {
                    video: { url: msg.videoMessage },
                    caption: `👁️ Statut de @${sender.split("@")[0]}`,
                    mentions: [sender]
                  });
                } else if (msg.conversation) {
                  await kaya.sendMessage(ownerNumber, {
                    text: `👁️ Statut de @${sender.split("@")[0]} :\n\n${msg.conversation}`,
                    mentions: [sender]
                  });
                }

              } catch (err) {
                console.error('❌ AutoStatus DM error:', err);
              }
            }
          });
        }

        return kaya.sendMessage(
          m.chat,
          { text: '✅ *Auto Status activé*\nLe bot regardera et enverra automatiquement les statuts au DM de l’owner.', contextInfo },
          { quoted: m }
        );
      }

      // ❌ OFF
      if (action === 'off') {
        global.autoStatus = false;
        return kaya.sendMessage(
          m.chat,
          { text: '❌ *Auto Status désactivé*', contextInfo },
          { quoted: m }
        );
      }

      // 📊 STATUS
      if (action === 'status') {
        return kaya.sendMessage(
          m.chat,
          { text: `👁️ *Auto Status*\nStatut : ${global.autoStatus ? '✅ ACTIVÉ' : '❌ DÉSACTIVÉ'}`, contextInfo },
          { quoted: m }
        );
      }

    } catch (err) {
      console.error('❌ autostatus error:', err);
      await kaya.sendMessage(
        m.chat,
        { text: '❌ Une erreur est survenue lors de la commande.', contextInfo },
        { quoted: m }
      );
    }
  }
};