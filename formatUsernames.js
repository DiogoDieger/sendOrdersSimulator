const fs = require("fs");
const path = require("path");

// Lê o arquivo usernames.txt
const usernamesFile = path.join(__dirname, "usernames.txt");

try {
  const data = fs.readFileSync(usernamesFile, "utf8");
  const usernames = data.trim().split("\n");

  // Formata cada nome de usuário no padrão solicitado
  usernames.forEach((username) => {
    const trimmedUsername = username.trim();
    // Ignora usernames que são compostos apenas por números
    if (trimmedUsername && !/^\d+$/.test(trimmedUsername)) {
      console.log(`919|${trimmedUsername}|150`);
    }
  });
} catch (error) {
  console.error("Erro ao ler o arquivo:", error.message);
}
