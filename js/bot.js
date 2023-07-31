const moment = require("moment");
const { manager } = require("./nlpManagerConfig");
const fetch = require("node-fetch");

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
  return duracaoPausa.asMinutes() < 720; // Retornar verdadeiro se a pausa for inferior a 60 minutos
}

// Função para enviar a resposta após um tempo aleatório entre 2 e 5 segundos
async function enviarRespostaAposAguardar(chatId, resposta) {
  try {
    // Verificar se o atendimento está pausado para esse chat
    if (estaPausado(chatId)) {
      return;
    }

    // Envia o status de "digitando"
    const chat = await getClient().getChatById(chatId);
    chat.sendStateTyping();

    // Aguardar um tempo aleatório antes de enviar a resposta
    const tempoAguardar = Math.floor(Math.random() * 3000) + 2000; // Tempo aleatório entre 2 e 5 segundos
    await new Promise((resolve) => setTimeout(resolve, tempoAguardar));

    // Enviar a resposta
    await getClient().sendMessage(chatId, resposta);
  } catch (error) {
    console.error("Erro ao enviar a resposta:", error);
  }
}

// Mapa para armazenar as respostas de cada intenção
const intentResponses = new Map();

// Função para carregar as respostas dinamicamente
async function loadResponsesFromAPI() {
  try {
    const responsesResponse = await fetch("http://localhost:5000/api/answers");
    const responses = await responsesResponse.json();

    for (const response of responses) {
      // Verifique se a intenção já possui respostas no mapa
      if (intentResponses.has(response.intent)) {
        // Adicione a nova resposta ao array de respostas existente
        intentResponses.get(response.intent).push(response.response);
      } else {
        // Crie um novo array para a intenção e adicione a resposta
        intentResponses.set(response.intent, [response.response]);
      }
    }

    console.log("Respostas carregadas com sucesso!");
  } catch (error) {
    console.error("Erro ao carregar as respostas:", error);
  }
}

// Função para atualizar as respostas
function updateResponses(responses) {
  // Limpar o mapa de respostas atual
  intentResponses.clear();

  // Adicionar as novas respostas ao mapa
  for (const response of responses) {
    intentResponses.set(response.intent, response.response);
  }

  console.log("Respostas atualizadas com sucesso!");
}

// Carregar as respostas da API ao iniciar o bot
loadResponsesFromAPI();

// Função para treinar o modelo
async function trainModel() {
  try {
    await addDocuments();
    await addAnswers();

    await manager.train();
    manager.save();

    console.log("Modelo treinado e atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao treinar o modelo:", error.message);
  }
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

      // Processar a intenção da pergunta
      const response = await manager.process("pt", message.body.toLowerCase());
      const intent = response.intent;

      // Se a intenção for "atendente" ou "producao", pausar o atendimento por 60 minutos
      if (intent === "atendente" || intent === "producao") {
        const answer = "A nossa equipe irá te responder em breve.";
        await enviarRespostaAposAguardar(chatId, answer); // Enviar a resposta antes de pausar
        pausarAtendimento(chatId);
        console.log(`Chat ID ${chatId} pausado por 1 dia.`);
        return;
      }

      // Obter resposta a partir da intenção, ou utilizar a mensagem "Desculpe, não entendi sua pergunta."
      const responseArray = intentResponses.get(intent);
      const answer = responseArray
        ? responseArray[Math.floor(Math.random() * responseArray.length)]
        : "Desculpe, não entendi sua pergunta.";

      // Enviar a resposta após aguardar um tempo aleatório
      await enviarRespostaAposAguardar(chatId, answer);
    } else {
      console.log("Mensagem de grupo recebida, não será respondida.");
    }
  } catch (err) {
    console.error("Erro ao processar a mensagem:", err);
  }
});


// Exportar as funções que serão usadas no servidor
module.exports = {
  enviarRespostaAposAguardar,
  loadResponsesFromAPI,
  updateResponses,
  trainModel,
};
