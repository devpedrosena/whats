const { NlpManager } = require("node-nlp");
const axios = require("axios");

const manager = new NlpManager({ languages: ["pt"] });

// Função para adicionar os documentos ao NlpManager
async function addDocuments() {
  try {
    const response = await axios.get("http://localhost:5000/api/documents");
    const documents = response.data;

    for (const document of documents) {
      const message = document.message.toLowerCase(); // Convertendo a mensagem para minúsculas
      const intent = document.intent.toLowerCase(); // Convertendo a intenção para minúsculas
      manager.addDocument("pt", message, intent);
    }

    console.log("Documentos adicionados com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar os documentos:", error.message);
  }
}

// Função para adicionar as respostas ao NlpManager
async function addAnswers() {
  try {
    const response = await axios.get("http://localhost:5000/api/answers");
    const answers = response.data;

    for (const answer of answers) {
      manager.addAnswer("pt", answer.intent, answer.response);
    }

    console.log("Respostas adicionadas com sucesso!");
  } catch (error) {
    console.error("Erro ao adicionar as respostas:", error.message);
  }
}

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

// Função para processar a mensagem e obter a resposta
async function processMessage(message) {
  try {
    const response = await manager.process("pt", message.toLowerCase()); // Convertendo a mensagem para minúsculas
    console.log("Mensagem processada:", message);
    console.log("Intenção detectada:", response.intent);
    console.log("Score da intenção:", response.score);
    return response;
  } catch (error) {
    console.error("Erro ao processar a mensagem:", error.message);
    return null;
  }
}

// Exportar a função trainModel, a função processMessage e o objeto manager individualmente
module.exports = {
  addAnswers: addAnswers,
  trainModel: trainModel,
  processMessage: processMessage,
  manager: manager,
};

// Chamar a função trainModel para treinar o modelo
trainModel();
