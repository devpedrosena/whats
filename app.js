const express = require("express");
const { Client, Location } = require("whatsapp-web.js");
const bodyParser = require("body-parser");
const qrcode = require("qrcode-terminal");

const app = express();
const port = 3000;

// Configurações do cliente WhatsApp
const client = new Client();

// Eventos do cliente WhatsApp
client.on("qr", (qr) => {
  console.log("Escaneie o QR Code abaixo para fazer o login no WhatsApp Web:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("Cliente WhatsApp está pronto!");
});

client.on("message", (msg) => {
  console.log("Mensagem recebida: ", msg.body);
});

// Inicialização do cliente WhatsApp
client.initialize();

// Middleware para analisar JSON no corpo da solicitação
app.use(bodyParser.json());

// Rota do webhook para receber notificações do formulário
app.post("/webhook", (req, res) => {
  const {
    Whatsapp_DDD_9XXXXXXXX,
    Nome,
    email,
    PLATAFORMA,
    SEU_PERFIL,
    Selecione_uma_opção,
  } = req.body;

  if (!Whatsapp_DDD_9XXXXXXXX) {
    return res.status(400).json({ error: 'Campo "Whatsapp" é obrigatório.' });
  }

  // Convertendo o número de telefone para string
  const rawPhoneNumber = Whatsapp_DDD_9XXXXXXXX.toString().replace(/\D/g, "");

  // Tratamento para remover o primeiro dígito "9" apenas se o número tiver 11 dígitos
  let phoneNumber;
  if (rawPhoneNumber.length === 11 && rawPhoneNumber[2] === "9") {
    phoneNumber = `55${rawPhoneNumber.substring(
      0,
      2
    )}${rawPhoneNumber.substring(3)}@c.us`;
  } else {
    phoneNumber = `55${rawPhoneNumber}@c.us`;
  }

  // Verificar se o cliente WhatsApp está pronto e autenticado (após o evento "ready")
  if (!client.pupBrowser) {
    return res.status(500).json({
      error:
        "Cliente WhatsApp ainda não está pronto. Tente novamente mais tarde.",
    });
  }

  // Verificar se o número de telefone possui o formato correto
  const phoneNumberRegex = /^55\d{10,11}@c\.us$/;
  if (!phoneNumberRegex.test(phoneNumber)) {
    return res.status(400).json({
      error:
        "Número de telefone inválido. Certifique-se de que esteja no formato correto: 5571988674758@c.us ou 71988674714@c.us.",
    });
  }

  // Enviar a mensagem
  client
    .sendMessage(
      phoneNumber,
      `Olá, ${Nome} agradecemos o seu contato, em breve a nossa equipe irá te atender.`
    )
    .then((result) => {
      console.log("Mensagem enviada com sucesso!", result);

      const myPhone = "557192093801@c.us";
      const newContactReceiver = `*Novo Contato Recebido*

      *Nome do lead*: ${Nome},
      *Email*: ${email},
      *Whatsapp*: ${Whatsapp_DDD_9XXXXXXXX},
      *Plataforma*: ${PLATAFORMA},
      *Perfil*: ${SEU_PERFIL},
      *Seguidores*: ${Selecione_uma_opção}`;

      client
        .sendMessage(myPhone, newContactReceiver)
        .then((result2) => {
          console.log("Novo contato entregue com sucesso!", result2);
          res.status(200).json({ success: true });
        })
        .catch((error2) => {
          console.error("Erro ao enviar mensagem de contato:", error2);
          res
            .status(500)
            .json({ error: "Erro ao enviar mensagem de contato." });
        });
    })
    .catch((error) => {
      console.error("Erro ao enviar mensagem:", error);
      res.status(500).json({ error: "Erro ao enviar mensagem." });
    });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
