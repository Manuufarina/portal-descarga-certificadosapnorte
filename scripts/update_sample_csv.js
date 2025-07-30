const fs = require('fs');
const path = require('path');

const clientsPath = path.join(__dirname, '..', 'data', 'clients.json');
const csvPath = path.join(__dirname, '..', 'data', 'clients_sample.csv');

const clients = JSON.parse(fs.readFileSync(clientsPath, 'utf8'));
const rows = ['accessCode,clientName'];
for (const [code, { clientName }] of Object.entries(clients)) {
  rows.push(`${code},${clientName}`);
}
fs.writeFileSync(csvPath, rows.join('\n'));
console.log(`CSV updated at ${csvPath}`);
