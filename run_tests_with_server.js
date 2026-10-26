const { spawn } = require('child_process');

console.log('Spawning NexusAcademyLS Server...');
const server = spawn('node', ['server.js'], { stdio: 'pipe' });

server.stdout.on('data', data => {
  console.log('[SERVER]', data.toString().trim());
});

server.stderr.on('data', data => {
  console.error('[SERVER ERROR]', data.toString().trim());
});

setTimeout(() => {
  console.log('Server is running. Spawning test suite...');
  const tester = spawn('node', ['test_system.js'], { stdio: 'inherit' });

  tester.on('close', code => {
    console.log(`Test suite finished with exit code ${code}`);
    server.kill();
    process.exit(code);
  });
}, 1500);
