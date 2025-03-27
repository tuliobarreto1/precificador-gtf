
const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

console.log('Iniciando ambiente de desenvolvimento...');
console.log('Variáveis de ambiente carregadas:');
console.log('- Database:', process.env.DB_SERVER ? 'configurado' : 'não configurado');
console.log('- User:', process.env.DB_USER ? 'configurado' : 'não configurado');
console.log('- Database Name:', process.env.DB_DATABASE ? 'configurado' : 'não configurado');

// Iniciar o servidor API proxy
const apiProcess = spawn('node', [path.join(__dirname, 'src/server/api-proxy.js')], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Iniciar a aplicação Vite
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Manipular o encerramento dos processos
process.on('SIGINT', () => {
  console.log('Encerrando processos...');
  apiProcess.kill();
  viteProcess.kill();
  process.exit();
});

// Lidar com saídas dos processos
apiProcess.on('close', code => {
  console.log(`API proxy process exited with code ${code}`);
  viteProcess.kill();
  process.exit(code);
});

viteProcess.on('close', code => {
  console.log(`Vite process exited with code ${code}`);
  apiProcess.kill();
  process.exit(code);
});

console.log('Ambiente de desenvolvimento iniciado. Pressione Ctrl+C para encerrar.');
