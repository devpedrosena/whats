const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const app = express();
const port = 3000;

// Carregar as variáveis de ambiente a partir do arquivo .env
dotenv.config();

// Middleware para analisar JSON no corpo da solicitação
app.use(bodyParser.json());

// Importar a configuração e inicialização do WhatsApp
const { initializeWhatsApp } = require("./js/whatsapp");
initializeWhatsApp(); // Chamar a função para inicializar o cliente WhatsApp

// Importar a rota do webhook e a lógica para tratamento de mensagens
const { handleWebhook } = require("./js/webhook");
app.post("/webhook", handleWebhook);

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
