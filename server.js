const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
// Importar o objeto manager do bot.js
const bot = require("./js/bot");
const {
  addAnswers,
  trainModel,
} = require("./js/nlpManagerConfig");



const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuração da conexão com o banco de dados MySQL usando createPool
const pool = mysql.createPool({
  connectionLimit: 10, // Número máximo de conexões simultâneas no pool
  host: "srv795.hstgr.io",
  user: "u704246324_whats",
  password: "Pedro123$",
  database: "u704246324_whats",
});

// Rota para inserir um novo documento
app.post("/api/addDocument", (req, res) => {
  const { language, message, intent } = req.body;

  const sql =
    "INSERT INTO documents (language, message, intent) VALUES (?, ?, ?)";
  pool.query(sql, [language, message, intent], (error, results) => {
    if (error) {
      console.error("Erro ao inserir o documento:", error);
      return res.status(500).json({ error: "Erro ao inserir o documento" });
    }
    return res.status(200).json({ message: "Documento inserido com sucesso" });
  });
});

// Rota para obter todas as intenções existentes
app.get("/api/intentions", (req, res) => {
  const sql = "SELECT DISTINCT intent FROM documents";
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Erro ao obter as intenções:", error);
      return res.status(500).json({ error: "Erro ao obter as intenções" });
    }
    const intentions = results.map((item) => item.intent);
    return res.status(200).json(intentions);
  });
});

// Rota para obter todos os documentos
app.get("/api/documents", (req, res) => {
  const sql = "SELECT * FROM documents";
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Erro ao obter os documentos:", error);
      return res.status(500).json({ error: "Erro ao obter os documentos" });
    }
    return res.status(200).json(results);
  });
});

// Rota para inserir uma nova resposta
app.post("/api/addAnswer", (req, res) => {
  const { language, intent, response } = req.body;

  const sql =
    "INSERT INTO answers (language, intent, response) VALUES (?, ?, ?)";
  pool.query(sql, [language, intent, response], (error, results) => {
    if (error) {
      console.error("Erro ao inserir a resposta:", error);
      return res.status(500).json({ error: "Erro ao inserir a resposta" });
    }
    return res.status(200).json({ message: "Resposta inserida com sucesso" });
  });
});


// Rota para deletar um documento pelo ID
app.delete("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  console.log("Excluindo documento com ID:", id); // Adicione este log

  const sql = "DELETE FROM documents WHERE id = ?";
  pool.query(sql, [id], (error, results) => {
    if (error) {
      console.error("Erro ao excluir o documento:", error);
      return res.status(500).json({ error: "Erro ao excluir o documento" });
    }
    return res.status(200).json({ message: "Documento excluído com sucesso" });
  });
});


// Rota para atualizar um documento pelo ID
app.put("/api/documents/:id", (req, res) => {
  const { id } = req.params;
  const { language, message, intent } = req.body; // Certifique-se de que a intent esteja sendo passada corretamente no body.

  const sql = "UPDATE documents SET language = ?, message = ?, intent = ? WHERE id = ?";
  pool.query(sql, [language, message, intent, id], (error, results) => {
    if (error) {
      console.error("Erro ao atualizar o documento:", error);
      return res.status(500).json({ error: "Erro ao atualizar o documento" });
    }
    return res.status(200).json({ message: "Documento atualizado com sucesso" });
  });
});

// Rota para obter todas as respostas existentes
app.get("/api/answers", (req, res) => {
  const sql = "SELECT * FROM answers";
  pool.query(sql, (error, results) => {
    if (error) {
      console.error("Erro ao obter as respostas:", error);
      return res.status(500).json({ error: "Erro ao obter as respostas" });
    }
    return res.status(200).json(results);
  });
});

// Rota para atualizar uma resposta pelo ID
app.put("/api/answers/:id", (req, res) => {
  const { id } = req.params;
  const { language, intent, response } = req.body;

  const sql = "UPDATE answers SET language = ?, intent = ?, response = ? WHERE id = ?";
  pool.query(sql, [language, intent, response, id], (error, results) => {
    if (error) {
      console.error("Erro ao atualizar a resposta:", error);
      return res.status(500).json({ error: "Erro ao atualizar a resposta" });
    }
    return res.status(200).json({ message: "Resposta atualizada com sucesso" });
  });
});

// Rota para deletar uma resposta pelo ID
app.delete("/api/answers/:id", (req, res) => {
  const { id } = req.params;
  console.log("Excluindo resposta com ID:", id);

  const sql = "DELETE FROM answers WHERE id = ?";
  pool.query(sql, [id], (error, results) => {
    if (error) {
      console.error("Erro ao excluir a resposta:", error);
      return res.status(500).json({ error: "Erro ao excluir a resposta" });
    }
    return res.status(200).json({ message: "Resposta excluída com sucesso" });
  });
});


// Rota para atualizar manualmente as respostas e treinamento do bot
app.post("/api/updateBot", async (req, res) => {
  try {
    // Chama a função para adicionar as respostas ao NlpManager
    await addAnswers();

    // Chama a função para treinar o modelo (se for necessário)
    await trainModel();

    // Chama a função para carregar as respostas dinamicamente
    await bot.loadResponsesFromAPI(pool);

    return res.status(200).json({ message: "Bot atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar o bot:", error);
    return res.status(500).json({ error: "Erro ao atualizar o bot" });
  }
});


// Inicializa o servidor
const port = 5000;
app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
