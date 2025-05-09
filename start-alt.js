
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Verificar se o arquivo .env existe
const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log(`Arquivo .env encontrado em: ${envPath}`);
  
  // Exibir o conteúdo do arquivo para debug (sem a senha)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const safeContent = envContent.replace(/DB_PASSWORD=.*/g, 'DB_PASSWORD=***HIDDEN***');
  console.log('Conteúdo do arquivo .env (senha oculta):');
  console.log(safeContent);
} else {
  console.error(`ERRO: Arquivo .env não encontrado em: ${envPath}`);
  console.error('Por favor, crie o arquivo .env na raiz do projeto com as credenciais de banco de dados.');
  process.exit(1);
}

// Carregar variáveis de ambiente
dotenv.config({ path: envPath });

console.log('====================================================');
console.log('Iniciando ambiente de desenvolvimento (modo alternativo)...');
console.log('Variáveis de ambiente carregadas:');
console.log('- Database Server:', process.env.DB_SERVER ? process.env.DB_SERVER : 'não configurado');
console.log('- Database Port:', process.env.DB_PORT ? process.env.DB_PORT : 'não configurado');
console.log('- Database User:', process.env.DB_USER ? process.env.DB_USER : 'não configurado');
console.log('- Database Name:', process.env.DB_DATABASE ? process.env.DB_DATABASE : 'não configurado');
console.log('- JWT Secret:', process.env.JWT_SECRET ? 'configurado' : 'não configurado');
console.log('====================================================');

// Iniciar o servidor API proxy
console.log('Iniciando servidor API proxy...');
const apiProcess = spawn('node', [path.join(__dirname, 'src/server/api-proxy.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Iniciar a aplicação com alternativa ao Vite padrão
console.log('Iniciando web-dev-server...');
const webProcess = spawn('npx', ['@web/dev-server', '--node-resolve', '--watch', '--app-index', 'index.html', '--port', '8080'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Manipular o encerramento dos processos
process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  apiProcess.kill();
  webProcess.kill();
  process.exit();
});

// Lidar com saídas dos processos
apiProcess.on('close', code => {
  console.log(`API proxy process exited with code ${code}`);
  webProcess.kill();
  process.exit(code);
});

webProcess.on('close', code => {
  console.log(`Web server process exited with code ${code}`);
  apiProcess.kill();
  process.exit(code);
});

console.log('Ambiente de desenvolvimento iniciado. Pressione Ctrl+C para encerrar.');
console.log('====================================================');
