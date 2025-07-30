const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node apply_csv_update.js <csv-file>');
  process.exit(1);
}
const csvFile = process.argv[2];

const clientsPath = path.join(__dirname, '..', 'data', 'clients.json');
const clients = fs.existsSync(clientsPath)
  ? JSON.parse(fs.readFileSync(clientsPath, 'utf8'))
  : {};

const lines = fs.readFileSync(csvFile, 'utf8').trim().split(/\r?\n/);
const headers = lines.shift().split(',');
const indexCode = headers.indexOf('accessCode');
const indexName = headers.indexOf('clientName');
if (indexCode === -1 || indexName === -1) {
  console.error('CSV must contain accessCode and clientName columns');
  process.exit(1);
}
for (const line of lines) {
  if (!line.trim()) continue;
  const cols = line.split(',');
  const code = cols[indexCode].trim();
  const name = cols[indexName].trim();
  if (!code || !name) continue;
  if (!clients[code]) {
    clients[code] = { clientName: name, files: [] };
  } else {
    clients[code].clientName = name;
  }
}
fs.writeFileSync(clientsPath, JSON.stringify(clients, null, 2));
console.log('clients.json updated');
