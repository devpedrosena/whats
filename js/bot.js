const moment = require("moment");
const nlpManager = require("./nlpManagerConfig");

// Configurações do WhatsApp
const { initializeWhatsApp, getClient } = require("./whatsapp");

// Inicializar o cliente WhatsApp
initializeWhatsApp();

// Armazenar os chats que estão pausados e o horário da última pausa
const chatsEmPausa = new Map();

// Função para pausar o atendimento em um chat
function pausarAtendimento(chatId) {
  chatsEmPausa.set(chatId, moment());
}

// Função para verificar se o atendimento está pausado em um chat
function estaPausado(chatId) {
  if (!chatsEmPausa.has(chatId)) return false;
  const ultimaPausa = chatsEmPausa.get(chatId);
  const agora = moment();
  const duracaoPausa = moment.duration(agora.diff(ultimaPausa));
  return duracaoPausa.asMinutes() < 60; // Retornar verdadeiro se a pausa for inferior a 5 minutos
}

// Função para enviar a resposta após um tempo aleatório entre 3 e 10 segundos
function enviarRespostaAposAguardar(chatId, resposta) {
  const tempoAguardar = Math.floor(Math.random() * 8000) + 3000; // Tempo aleatório entre 3 e 10 segundos
  setTimeout(async () => {
    await getClient().sendMessage(chatId, resposta);
  }, tempoAguardar);
}

// Evento de mensagem recebida
getClient().on("message", async (message) => {
  try {
    // Verificar se a mensagem é de um usuário e não do próprio bot
    if (message.fromMe) return;

    // Obter o Chat ID de quem está enviando a mensagem
    const chatId = message.from;

    // Verificar o tipo de destinatário (individual ou grupo)
    const chat = await message.getChat();
    if (!chat.isGroup) {
      // Não responder a mensagens de grupos, apenas a mensagens de contatos individuais

      // Verificar se o atendimento está pausado para esse chat
      if (estaPausado(chatId)) {
        return;
      }

      // Processar a intenção da pergunta
      const response = await nlpManager.process(
        "pt",
        message.body.toLowerCase()
      );
      const intent = response.intent;

      // Obter resposta a partir da intenção
      let answer;
      switch (intent) {
        case "saudacao.oi":
          answer = response.answer;
          break;
        case "atendente.falar":
          // Pausar o atendimento por 5 minutos
          pausarAtendimento(chatId);
          answer = response.answer;
          break;
        default:
          answer = "Desculpe, não entendi sua pergunta.";
      }

      // Enviar a resposta após um tempo aleatório
      enviarRespostaAposAguardar(chatId, answer);
    } else {
      console.log("Mensagem de grupo recebida, não será respondida.");
    }
  } catch (err) {
    console.error("Erro ao processar a mensagem:", err);
  }
});
