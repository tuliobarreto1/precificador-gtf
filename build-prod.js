
// Script personalizado para construir o projeto em produção
// Contorna problemas com scripts shell no ambiente Node.js
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Iniciando build de produção personalizado...');

// Aumentar limite de memória para o build
process.env.NODE_OPTIONS = '--max-old-space-size=1024';

try {
  // Caminho para o executável Vite (evita usar o script shell .bin/vite)
  const vitePath = path.resolve(__dirname, 'node_modules/vite/bin/vite.js');
  
  // Verificar se o arquivo existe
  if (!fs.existsSync(vitePath)) {
    throw new Error(`Arquivo Vite não encontrado em: ${vitePath}`);
  }
  
  console.log(`Usando Vite em: ${vitePath}`);
  console.log('Configurações de ambiente:', {
    nodeOptions: process.env.NODE_OPTIONS,
    nodeEnv: process.env.NODE_ENV || 'production'
  });

  // Definir NODE_ENV como production
  process.env.NODE_ENV = 'production';
  
  // Executar o build diretamente através do Node.js
  console.log('Executando build...');
  execSync(`node "${vitePath}" build`, { 
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('Build concluído com sucesso!');
  process.exit(0);
} catch (error) {
  console.error('Erro durante o build:', error);
  process.exit(1);
}
