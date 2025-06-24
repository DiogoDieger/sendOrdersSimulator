// Carrega variáveis de ambiente se disponíveis
require("dotenv").config({ path: ".env.local" });

module.exports = {
  // Database URL
  DATABASE_URL:
    "mysql://root:czMxQOnblXOGkJZxaTqnpHMFSFNCHvJE@nozomi.proxy.rlwy.net:54059/bot_instagram4",

  // Scrape.do API Key
  SCRAPE_DO_API_KEY:
    process.env.SCRAPE_DO_API_KEY ||
    "af98a58cdfea4a03b399558566e3a1e4dbfa80627d0",

  // Configurações do simulador
  ORDERS_PER_MINUTE: parseInt(process.env.ORDERS_PER_MINUTE) || 3,
  SERVICE_ID: parseInt(process.env.SERVICE_ID) || 1,
};
