
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('Iniciando processo de build para produção...');

// Define o limite de memória para o processo Node.js
process.env.NODE_OPTIONS = '--max-old-space-size=1024'; // Aumentamos para 1GB

try {
  console.log('Preparando ambiente...');
  console.log('Configurações de memória: ' + process.env.NODE_OPTIONS);
  
  console.log('Executando o build com Vite diretamente...');
  
  // Usamos o caminho relativo para o binário do Vite em node_modules
  const vitePath = path.resolve(__dirname, 'node_modules/vite/bin/vite.js');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(vitePath)) {
    throw new Error(`Arquivo Vite não encontrado em: ${vitePath}`);
  }
  
  // Executar o Vite diretamente sem usar o script shell
  execSync(`node "${vitePath}" build`, { 
    stdio: 'inherit',
    env: {
      ...process.env,
      FORCE_COLOR: '1' // Manter saída colorida
    },
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });
  
  console.log('Build concluído com sucesso!');
} catch (error) {
  console.error('Erro durante o processo de build:');
  console.error(error);
  process.exit(1);
}
