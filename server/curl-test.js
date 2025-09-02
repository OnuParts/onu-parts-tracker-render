import http from 'http';

// Test the export endpoint directly
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/simple-export?month=04/2025&type=all',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE COMPLETED');
    // Only print the first few lines to avoid flooding the console
    const lines = data.split('\n');
    console.log('First 10 lines of response:');
    console.log(lines.slice(0, 10).join('\n'));
    
    if (lines.length > 10) {
      console.log(`... and ${lines.length - 10} more lines`);
    }
    
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
  process.exit(1);
});

req.end();
