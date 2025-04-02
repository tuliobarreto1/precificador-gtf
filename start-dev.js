
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
  
  // Carregar variáveis de ambiente
  dotenv.config({ path: envPath });
  
  // Verificar se as variáveis críticas foram carregadas
  if (!process.env.DB_SERVER || !process.env.DB_USER || !process.env.DB_PASSWORD) {
    console.error('ERRO CRÍTICO: Variáveis de ambiente do banco de dados não carregadas!');
    console.error('Por favor, verifique o arquivo .env');
  } else {
    console.log('Variáveis de ambiente do banco de dados carregadas com sucesso!');
  }
} else {
  console.error(`ERRO: Arquivo .env não encontrado em: ${envPath}`);
  console.error('Por favor, crie o arquivo .env na raiz do projeto com as credenciais de banco de dados.');
  process.exit(1);
}

console.log('====================================================');
console.log('Iniciando ambiente de desenvolvimento...');
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

// Iniciar a aplicação Vite
console.log('Iniciando servidor Vite...');
const viteProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env }
});

// Manipular o encerramento dos processos
process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
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
console.log('====================================================');
