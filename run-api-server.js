
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
console.log('Iniciando servidor API proxy...');
console.log('Variáveis de ambiente carregadas:');
console.log('- Database Server:', process.env.DB_SERVER ? process.env.DB_SERVER : 'não configurado');
console.log('- Database Port:', process.env.DB_PORT ? process.env.DB_PORT : 'não configurado');
console.log('- Database User:', process.env.DB_USER ? process.env.DB_USER : 'não configurado');
console.log('- Database Name:', process.env.DB_DATABASE ? process.env.DB_DATABASE : 'não configurado');
console.log('====================================================');

// Iniciar o servidor API proxy
console.log('Iniciando apenas o servidor API proxy...');
const apiProcess = spawn('node', [path.join(__dirname, 'src/server/api-proxy.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Manipular o encerramento dos processos
process.on('SIGINT', () => {
  console.log('\nEncerrando processo...');
  apiProcess.kill();
  process.exit();
});

// Lidar com saídas dos processos
apiProcess.on('close', code => {
  console.log(`API proxy process exited with code ${code}`);
  process.exit(code);
});

console.log('Servidor API proxy iniciado. Pressione Ctrl+C para encerrar.');
console.log('====================================================');
console.log('🚀 Para testar a conexão com o banco de dados, acesse:');
console.log('   http://localhost:3001/api/status');
console.log('   http://localhost:3001/api/test-connection');
console.log('====================================================');
