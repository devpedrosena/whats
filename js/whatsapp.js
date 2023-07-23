const { Client } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client();

module.exports = {
  initializeWhatsApp: () => {
    // Eventos do WhatsApp
    client.on("qr", (qr) => {
      console.log(
        "Escaneie o QR Code abaixo para fazer o login no WhatsApp Web:"
      );
      qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
      console.log("Cliente WhatsApp está pronto!");
    });

    // Inicializar o cliente WhatsApp
    client.initialize();
  },
  getClient: () => client,
};
