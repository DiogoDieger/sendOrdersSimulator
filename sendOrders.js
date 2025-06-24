const fs = require("fs");
const axios = require("axios");

const API_KEY = "cc21d5b82c3689df111ac47cad4136fe";
const SERVICE_ID = 811;
const API_URL = "https://soupopular.net/api/v2";
const ordersPerMinute = 1; // ajuste conforme necessário
const delayMs = 60000 / ordersPerMinute; // tempo entre requisições

// Função para aguardar
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Carregar usernames do arquivo
const usernames = fs
  .readFileSync("./usernames.txt", "utf-8")
  .split("\n")
  .map((line) => line.trim())
  .filter((line) => line.length > 0);

async function sendOrder(username, quantity) {
  try {
    const data = new URLSearchParams();
    data.append("key", API_KEY);
    data.append("action", "add");
    data.append("service", SERVICE_ID);
    data.append("link", username);
    data.append("quantity", quantity.toString());
    data.append("runs", "1");
    data.append("interval", "1");

    const response = await axios.post(API_URL, data);
    console.log(response.data);
    console.log(
      `✅ Enviado para ${username} | ID do pedido: ${response.data.order}`
    );
  } catch (error) {
    console.error(
      `❌ Erro ao enviar para ${username}:`,
      error.response?.data || error.message
    );
  }
}

async function main() {
  for (const username of usernames) {
    const quantity = Math.floor(Math.random() * 500) + 1;
    await sendOrder(username, quantity);
    await delay(delayMs);
  }
}

main();
