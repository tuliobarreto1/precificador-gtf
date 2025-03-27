
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
console.log('Iniciando ambiente de desenvolvimento...');
console.log('Variáveis de ambiente carregadas:');
console.log('- Database Server:', process.env.DB_SERVER ? process.env.DB_SERVER : 'não configurado');
console.log('- Database Port:', process.env.DB_PORT ? process.env.DB_PORT : 'não configurado');
console.log('- Database User:', process.env.DB_USER ? process.env.DB_USER : 'não configurado');
console.log('- Database Name:', process.env.DB_DATABASE ? process.env.DB_DATABASE : 'não configurado');
console.log('- JWT Secret:', process.env.JWT_SECRET ? 'configurado' : 'não configurado');
console.log('====================================================');

// Função para iniciar processos com retentativas
function startProcessWithRetry(name, command, args, maxRetries = 3) {
  console.log(`Iniciando ${name}...`);
  
  let retries = 0;
  let process = null;
  
  function startProcess() {
    process = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    process.on('error', (err) => {
      console.error(`Erro ao iniciar ${name}:`, err);
      retryProcess();
    });
    
    process.on('close', (code) => {
      if (code !== 0 && retries < maxRetries) {
        console.log(`${name} encerrou com código ${code}, tentando reiniciar...`);
        retryProcess();
      } else if (code !== 0) {
        console.error(`${name} encerrou com código ${code} após ${retries} tentativas.`);
        process.exit(code);
      }
    });
    
    return process;
  }
  
  function retryProcess() {
    retries++;
    console.log(`Tentativa ${retries} de ${maxRetries} para iniciar ${name}...`);
    if (retries <= maxRetries) {
      setTimeout(() => {
        startProcess();
      }, 2000); // Espera 2 segundos antes de tentar novamente
    }
  }
  
  return startProcess();
}

// Iniciar o servidor API proxy com retentativas
console.log('Iniciando servidor API proxy...');
const apiProcess = startProcessWithRetry(
  'Servidor API',
  'node', 
  [path.join(__dirname, 'src/server/api-proxy.js')]
);

// Iniciar a aplicação Vite após o servidor API estar rodando
console.log('Iniciando servidor Vite...');
const viteProcess = startProcessWithRetry(
  'Servidor Vite',
  'npm',
  ['run', 'dev']
);

// Manipular o encerramento dos processos
process.on('SIGINT', () => {
  console.log('\nEncerrando processos...');
  apiProcess.kill();
  viteProcess.kill();
  process.exit();
});

// Lidar com saídas dos processos
apiProcess.on('close', code => {
  if (code !== null) {
    console.log(`API proxy process exited with code ${code}`);
    viteProcess.kill();
    process.exit(code);
  }
});

viteProcess.on('close', code => {
  if (code !== null) {
    console.log(`Vite process exited with code ${code}`);
    apiProcess.kill();
    process.exit(code);
  }
});

console.log('Ambiente de desenvolvimento iniciado. Pressione Ctrl+C para encerrar.');
console.log('====================================================');
console.log('🚀 Para testar a conexão com o banco de dados, acesse:');
console.log('   http://localhost:8080/api/status');
console.log('   http://localhost:8080/api/test-connection');
console.log('====================================================');
