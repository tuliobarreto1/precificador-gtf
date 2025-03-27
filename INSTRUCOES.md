
# Instruções para Executar o Projeto com Conexão SQL Real

Este projeto foi configurado para se conectar ao SQL Server usando um servidor proxy local. Siga estas instruções para executar o projeto corretamente.

## Pré-requisitos

- Node.js 14 ou superior
- NPM 6 ou superior
- Acesso ao banco de dados SQL Server especificado nas variáveis de ambiente

## Configuração

1. Certifique-se de que o arquivo `.env` contém as credenciais corretas do SQL Server:
   ```
   VITE_DB_SERVER=asalocadora-prd-nlb-rds-4f4ca747cca4f9bf.elb.us-east-1.amazonaws.com
   VITE_DB_PORT=1433
   VITE_DB_USER=tulio.barreto
   VITE_DB_PASSWORD=gjC9u6$nq%#TqPsn+?
   VITE_DB_DATABASE=Locavia
   ```

2. Instale as dependências do projeto:
   ```
   npm install
   ```

## Executando o Projeto em Desenvolvimento

Para iniciar o servidor de desenvolvimento com o proxy API:

```
node start-dev.js
```

Este comando iniciará:
- Um servidor proxy local na porta 3001 para lidar com as consultas SQL
- O servidor de desenvolvimento Vite para a aplicação frontend

## Notas de Implementação

- A conexão SQL é feita através de um servidor proxy local para evitar problemas com CORS e limitações do navegador.
- As consultas SQL são executadas no servidor backend e os resultados são enviados para o frontend através de uma API REST.
- Em ambientes de produção, você precisará configurar um servidor backend real para processar as consultas SQL.

## Estrutura da Solução

- `src/server/api-proxy.js`: Servidor Express que lida com as consultas SQL
- `src/lib/sql-connection.ts`: Módulo que faz requisições à API para buscar dados
- `vite.config.ts`: Configuração do Vite com proxy para a API local
- `start-dev.js`: Script para iniciar tanto o servidor proxy quanto o servidor Vite

## Solução de Problemas

Se você encontrar problemas ao conectar-se ao banco de dados:

1. Verifique se as credenciais no arquivo `.env` estão corretas.
2. Certifique-se de que o servidor de banco de dados está acessível da sua rede.
3. Verifique os logs do servidor para mensagens de erro detalhadas.
