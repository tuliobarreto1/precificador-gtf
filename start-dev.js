
const { spawn } = require('child_process');
const path = require('path');

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
