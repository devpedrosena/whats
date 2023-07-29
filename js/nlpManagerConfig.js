const { NlpManager } = require("node-nlp");

const manager = new NlpManager({ languages: ["pt"] });

// Adicionar os modelos para processar a intenção
manager.addDocument("pt", "oi", "saudacao.oi");
manager.addDocument("pt", "olá", "saudacao.oi");
manager.addDocument("pt", "tudo bem", "saudacao.oi");
manager.addDocument("pt", "falar com um atendente", "atendente.falar");
manager.addAnswer("pt", "saudacao.oi", "Olá! Tudo bem com você?");
manager.addAnswer(
  "pt",
  "atendente.falar",
  "Um atendente irá te atender em breve."
);

// Treinar o modelo
(async () => {
  await manager.train();
  manager.save();
})();

module.exports = manager;
