
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
  
  // Vamos usar o módulo Vite diretamente ao invés do script shell
  const viteMainModule = path.resolve(__dirname, 'node_modules/vite/dist/node/index.js');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(viteMainModule)) {
    throw new Error(`Módulo Vite não encontrado em: ${viteMainModule}`);
  }
  
  // Executar um comando node que importa o Vite e chama o método build
  const buildCommand = `node -e "require('${viteMainModule.replace(/\\/g, '\\\\')}')" --mode production build`;
  
  execSync(buildCommand, { 
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
