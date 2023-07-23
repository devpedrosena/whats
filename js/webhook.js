const { getClient } = require("./whatsapp");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Configurações do Nodemailer para envio de e-mails
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

module.exports = {
  handleWebhook: (req, res) => {
    const formData = req.body;

    // Extrair os valores do array de objetos
    const {
      email,
      Nome,
      PLATAFORMA,
      SEU_PERFIL,
      Whatsapp_DDD_9XXXXXXXX,
      Selecione_uma_opção,
      Mensagem,
    } = formData.reduce((result, { key, value }) => {
      result[key] = value;
      return result;
    }, {});

    // Verificar se o número de telefone possui o formato correto
    const rawPhoneNumber = Whatsapp_DDD_9XXXXXXXX.toString().replace(/\D/g, "");
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
    const client = getClient();
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

    // Enviar a mensagem de confirmação para o cliente
    client
      .sendMessage(
        phoneNumber,
        `Olá, ${Nome}! Agradecemos o seu contato, em breve a nossa equipe irá te atender.`
      )
      .then((result) => {
        console.log("Mensagem enviada com sucesso!");

        const myPhone = "557192093801@c.us";
        const newContactReceiver = `*Novo Contato Recebido*\n\n- Nome do lead: ${Nome}\n- Email: ${email}\n- Whatsapp: ${Whatsapp_DDD_9XXXXXXXX}\n- Plataforma: ${PLATAFORMA}\n- Perfil: ${SEU_PERFIL}\n- Seguidores: ${Selecione_uma_opção}\n- Mensagem: ${Mensagem}`;

        // Enviar informações do novo contato para o número configurado
        client
          .sendMessage(myPhone, newContactReceiver)
          .then((result2) => {
            console.log("Novo contato entregue com sucesso!");
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

    // Enviar a mensagem personalizada por e-mail
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_DESTINATION,
      subject: `Novo contato recebido de ${Nome}`,
      html: `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
            }
            .header {
              background-color: #007bff;
              color: #fff;
              text-align: center;
              padding: 20px 0;
            }
            .content {
              padding: 20px;
            }
            .footer {
              background-color: #f1f1f1;
              text-align: center;
              padding: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Novo Contato Recebido</h1>
          </div>
          <div class="content">
            <p><strong>Nome do lead:</strong> ${Nome}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Whatsapp:</strong> ${Whatsapp_DDD_9XXXXXXXX}</p>
            <p><strong>Plataforma:</strong> ${PLATAFORMA}</p>
            <p><strong>Perfil:</strong> ${SEU_PERFIL}</p>
            <p><strong>Seguidores:</strong> ${Selecione_uma_opção}</p>
            <p><strong>Mensagem:</strong> ${Mensagem}</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bahia Fun. Todos os direitos reservados.</p>
          </div>
        </body>
      </html>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Erro ao enviar e-mail:", error);
        res.status(500).json({ error: "Erro ao enviar e-mail." });
      } else {
        console.log("E-mail enviado com sucesso:", info.response);
        res.status(200).json({ success: true });
      }
    });
  },
};
