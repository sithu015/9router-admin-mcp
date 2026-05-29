import { spawn } from 'child_process';
import readline from 'readline';

const child = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'ignore']
});

const rl = readline.createInterface({
  input: child.stdout,
  terminal: false
});

let state = 'init';

rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line);
    
    if (msg.id === 1 && state === 'init') {
      console.log('Init successful. Calling 9router_health tool...');
      state = 'callTool';
      const callToolRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "9router_list_providers",
          arguments: {}
        }
      };
      child.stdin.write(JSON.stringify(callToolRequest) + '\n');
    } else if (msg.id === 2 && state === 'callTool') {
      console.log('Tool call response:', JSON.stringify(msg, null, 2));
      console.log('Test successful! Closing...');
      child.kill();
      process.exit(0);
    } else if (msg.error) {
      console.error('Error received:', msg.error);
      child.kill();
      process.exit(1);
    }
  } catch (e) {
    console.log('Non-JSON output:', line);
  }
});

const initRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  }
};

console.log('Sending initialize request...');
child.stdin.write(JSON.stringify(initRequest) + '\n');
