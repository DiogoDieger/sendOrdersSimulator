const fs = require("fs");
const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { v4: uuidv4 } = require("uuid");
const config = require("./config");

// Definir DATABASE_URL como variável de ambiente antes de inicializar o Prisma
process.env.DATABASE_URL = config.DATABASE_URL;

const prisma = new PrismaClient();

// Configurações
const ordersPerMinute = config.ORDERS_PER_MINUTE;
const delayMs = 60000 / ordersPerMinute;
const serviceId = config.SERVICE_ID;
const scrapeApiKey = config.SCRAPE_DO_API_KEY;

// Função para aguardar
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para extrair username limpo
function extractUsername(rawUsername) {
  return rawUsername
    .replace("https://www.instagram.com/", "")
    .replace("/", "")
    .trim();
}

// Função para buscar informações do perfil Instagram usando scrape.do
async function getInstagramProfileInfo(username, apiKey) {
  try {
    const targetUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const scrapeDoUrl = `https://api.scrape.do?token=${apiKey}&url=${encodeURIComponent(
      targetUrl
    )}&customHeaders=true&blockResources=false&timeout=15000`;

    const response = await axios.get(scrapeDoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "x-ig-app-id": "936619743392459",
      },
    });

    if (!response.data || !response.data.data || !response.data.data.user) {
      return { exists: false };
    }

    const user = response.data.data.user;

    return {
      exists: true,
      isPrivate: user.is_private,
      followerCount: user.edge_followed_by?.count ?? 0,
      instagramUserId: user.id,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar perfil:", error.message || error);
    return { exists: false };
  }
}

// Função para executar operações Prisma com retry
async function safePrismaCall(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.error(
        `❌ Erro no Prisma (tentativa ${attempt}/${maxRetries}):`,
        error.message
      );
      if (attempt === maxRetries) {
        throw error;
      }
      await delay(1000 * attempt); // Backoff exponencial
    }
  }
}

// Função principal para processar um username
async function processUsername(username, totalAccounts = 150) {
  const targetUsername = extractUsername(username);
  const orderId = uuidv4();

  console.log(`\n🚀 Processando: ${targetUsername}`);

  try {
    // Busca informações do perfil Instagram
    console.log(`📍 Buscando informações do perfil ${targetUsername}...`);
    const profileInfo = await getInstagramProfileInfo(
      targetUsername,
      scrapeApiKey
    );

    if (!profileInfo.exists) {
      console.warn(
        `❌ Perfil ${targetUsername} não encontrado ou inacessível. Pulando...`
      );
      return;
    }

    if (profileInfo.isPrivate) {
      console.warn(
        `🔒 Perfil ${targetUsername} é privado. Continuando mesmo assim...`
      );
    }

    console.log(`✅ Perfil encontrado: ${targetUsername}`);
    console.log(`   - Seguidores: ${profileInfo.followerCount}`);
    console.log(`   - ID do Instagram: ${profileInfo.instagramUserId}`);
    console.log(`   - É privado: ${profileInfo.isPrivate ? "Sim" : "Não"}`);

    // Cria a MainOrder
    const mainOrder = await safePrismaCall(() =>
      prisma.mainOrder.create({
        data: {
          id: orderId,
          instagramTargetUsername: targetUsername,
          instagramUserId: profileInfo.instagramUserId || "unknown",
          totalAccounts,
          status: "pending",
          initialFollowCount: profileInfo.followerCount ?? null,
          serviceId: serviceId,
        },
      })
    );

    console.log(`✅ MainOrder criada: ${mainOrder.id}`);

    // Cria as Actions
    const actions = await Promise.all(
      Array.from({ length: totalAccounts }).map(() =>
        safePrismaCall(() =>
          prisma.action.create({
            data: {
              instagramTargetUsername: targetUsername,
              instagramUserId: profileInfo.instagramUserId || "unknown",
              status: "pending",
              mainOrderId: mainOrder.id,
              type: "FOLLOW",
            },
          })
        )
      )
    );

    console.log(
      `✅ Criadas ${actions.length} actions para MainOrder ${mainOrder.id}`
    );

    return {
      success: true,
      mainOrderId: mainOrder.id,
      targetUsername,
      totalAccounts,
      followerCount: profileInfo.followerCount,
      actionsCreated: actions.length,
    };
  } catch (error) {
    console.error(`❌ Erro ao processar ${targetUsername}:`, error.message);
    return {
      success: false,
      targetUsername,
      error: error.message,
    };
  }
}

// Função principal
async function main() {
  console.log("🎯 Iniciando processamento de usernames com Prisma...");
  console.log(`⚙️  Configurações:`);
  console.log(`   - Orders por minuto: ${ordersPerMinute}`);
  console.log(`   - Delay entre processamentos: ${delayMs}ms`);
  console.log(`   - Service ID: ${serviceId}`);

  try {
    // Carregar usernames do arquivo
    const usernames = fs
      .readFileSync("./usernames.txt", "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    console.log(`📋 Encontrados ${usernames.length} usernames para processar`);

    const results = [];

    // Processa cada username
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      console.log(`\n📊 Progresso: ${i + 1}/${usernames.length}`);

      const result = await processUsername(username, 150);
      results.push(result);

      // Delay entre processamentos (exceto no último)
      if (i < usernames.length - 1) {
        console.log(`⏳ Aguardando ${delayMs}ms antes do próximo...`);
        await delay(delayMs);
      }
    }

    // Relatório final
    console.log("\n📈 RELATÓRIO FINAL:");
    console.log("=".repeat(50));

    const successful = results.filter((r) => r && r.success);
    const failed = results.filter((r) => r && !r.success);

    console.log(`✅ Processados com sucesso: ${successful.length}`);
    console.log(`❌ Falharam: ${failed.length}`);
    console.log(`🎯 Total de MainOrders criadas: ${successful.length}`);
    console.log(
      `🎯 Total de Actions criadas: ${successful.reduce(
        (sum, r) => sum + (r.actionsCreated || 0),
        0
      )}`
    );

    if (failed.length > 0) {
      console.log("\n❌ Usernames que falharam:");
      failed.forEach((f) => {
        console.log(`   - ${f.targetUsername}: ${f.error}`);
      });
    }
  } catch (error) {
    console.error("❌ Erro fatal:", error.message);
  } finally {
    // Desconecta do Prisma
    await prisma.$disconnect();
    console.log("\n🔌 Desconectado do banco de dados");
  }
}

// Tratamento de erros não capturados
process.on("unhandledRejection", async (error) => {
  console.error("❌ Erro não tratado:", error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("\n⏹️  Interrompido pelo usuário");
  await prisma.$disconnect();
  process.exit(0);
});

// Executa o programa
main();
