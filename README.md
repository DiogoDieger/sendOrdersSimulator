# Send Orders Simulator com Prisma

Este simulador processa usernames do Instagram e cria orders diretamente no banco de dados usando Prisma, ao invés de fazer chamadas para APIs externas.

## Funcionalidades

- ✅ Busca informações dos perfis Instagram usando scrape.do
- ✅ Cria MainOrders e Actions diretamente no banco MySQL via Prisma
- ✅ Processamento em loop com delay configurável
- ✅ Retry automático para operações do banco
- ✅ Relatório detalhado do processamento
- ✅ Tratamento de erros robusto

## Configuração

### 1. Configure as variáveis de ambiente

Edite o arquivo `config.js` com suas configurações:

```javascript
module.exports = {
  // Sua connection string do MySQL
  DATABASE_URL: "mysql://usuario:senha@localhost:3306/nome_do_banco",

  // Sua chave da API do scrape.do
  SCRAPE_DO_API_KEY: "sua_chave_aqui",

  // Configurações do simulador
  ORDERS_PER_MINUTE: 1, // Quantas orders por minuto
  SERVICE_ID: 1, // ID do serviço no banco
};
```

### 2. Configure o Prisma Client

Certifique-se de que você tem o Prisma Client gerado:

```bash
# Se ainda não tem o cliente gerado
npx prisma generate

# Para aplicar migrações (se necessário)
npx prisma db push
```

### 3. Prepare o arquivo de usernames

Edite o arquivo `usernames.txt` com os usernames que deseja processar (um por linha):

```
luanaaragao2798
heitorgeraldes
luizhenriquediegues
...
```

## Como usar

### Execução simples:

```bash
node sendOrdersWithPrisma.js
```

### Ou usando npm:

```bash
npm start
```

## O que o programa faz

1. **Lê os usernames** do arquivo `usernames.txt`
2. **Para cada username:**

   - Busca informações do perfil usando scrape.do
   - Verifica se o perfil existe e coleta dados (seguidores, ID, privacidade)
   - Cria uma MainOrder no banco
   - Cria Actions (quantidade aleatória entre 1-5) associadas à MainOrder
   - Aguarda o delay configurado antes do próximo

3. **Exibe relatório final** com estatísticas do processamento

## Estruturas criadas no banco

### MainOrder

- ID único (UUID)
- Username do Instagram target
- Instagram User ID (coletado via scrape)
- Total de accounts/actions
- Status (sempre 'pending')
- Contagem inicial de seguidores
- Service ID

### Actions

- Username do Instagram target
- Instagram User ID
- Status (sempre 'pending')
- Tipo (sempre 'FOLLOW')
- Referência à MainOrder

## Exemplo de output

```
🎯 Iniciando processamento de usernames com Prisma...
⚙️  Configurações:
   - Orders por minuto: 1
   - Delay entre processamentos: 60000ms
   - Service ID: 1

📋 Encontrados 9 usernames para processar

📊 Progresso: 1/9

🚀 Processando: luanaaragao2798
📍 Buscando informações do perfil luanaaragao2798...
✅ Perfil encontrado: luanaaragao2798
   - Seguidores: 1234
   - ID do Instagram: 12345678901
   - É privado: Não
✅ MainOrder criada: abc123-def456-ghi789
✅ Criadas 3 actions para MainOrder abc123-def456-ghi789

⏳ Aguardando 60000ms antes do próximo...
...

📈 RELATÓRIO FINAL:
==================================================
✅ Processados com sucesso: 8
❌ Falharam: 1
🎯 Total de MainOrders criadas: 8
🎯 Total de Actions criadas: 23
```

## Tratamento de erros

- **Retry automático** para operações do banco (3 tentativas)
- **Perfis não encontrados** são pulados com aviso
- **Perfis privados** são processados normalmente
- **Interrupção manual** (Ctrl+C) desconecta limpo do banco
- **Erros não tratados** são capturados e desconectam do banco

## Dependências

- `@prisma/client` - Cliente do Prisma
- `axios` - Para requisições HTTP
- `uuid` - Para gerar IDs únicos
- `fs` - Para ler arquivos (nativo)
# sendOrdersSimulator
