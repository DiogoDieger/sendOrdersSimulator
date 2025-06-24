const fs = require("fs");
const axios = require("axios");

const API_KEY = "7e26d95dc0a1a9a8258d9314242ed081";
const SERVICE_ID = 919;
const API_URL = "https://provedorgram.com/api/v2";
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
    data.append("usernames", username);

    const response = await axios.post(API_URL, data);
    console.log(response.data);
    console.log(
      `✅ Enviado para ${username} | Quantidade: ${quantity} | ID do pedido: ${response.data.order}`
    );
  } catch (error) {
    console.error(
      `❌ Erro ao enviar para ${username}:`,
      error.response?.data || error.message
    );
  }
}

async function main() {
  console.log(
    `🚀 Iniciando envio de ordens para ${usernames.length} usuários...`
  );
  console.log(`📊 Service ID: ${SERVICE_ID}`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`⏱️ Ordens por minuto: ${ordersPerMinute}`);
  console.log(`⏱️ Intervalo entre ordens: ${delayMs}ms (${delayMs / 1000}s)\n`);

  for (let i = 0; i < usernames.length; i++) {
    const username = usernames[i];
    const quantity = Math.floor(Math.random() * 500) + 1;

    console.log(
      `[${i + 1}/${
        usernames.length
      }] Processando: ${username} (quantidade: ${quantity})`
    );
    await sendOrder(username, quantity);

    if (i < usernames.length - 1) {
      console.log(`💤 Aguardando ${delayMs / 1000}s antes da próxima ordem...`);
      await delay(delayMs);
    }
  }

  console.log("\n🎉 Todas as ordens foram processadas!");
}

main();
