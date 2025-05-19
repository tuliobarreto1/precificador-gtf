
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

console.log('Iniciando processo de build para produção...');

try {
  console.log('Preparando ambiente...');
  // Aumentando o limite de memória através do processo Node.js diretamente
  console.log('Executando o build com Vite...');
  execSync('npx vite build', { 
    stdio: 'inherit',
    env: process.env,
    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
  });
  
  console.log('Build concluído com sucesso!');
} catch (error) {
  console.error('Erro durante o processo de build:');
  console.error(error);
  process.exit(1);
}
