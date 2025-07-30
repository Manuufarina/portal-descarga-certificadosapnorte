import json
import csv
from pathlib import Path

def main():
    data_file = Path('data/clients.json')
    out_file = Path('data/sample_clients.csv')
    if not data_file.exists():
        raise SystemExit(f"Missing {data_file}")
    with data_file.open() as f:
        clients = json.load(f)
    # Write CSV with header: access_code,client_name
    with out_file.open('w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['access_code', 'client_name'])
        for code, info in clients.items():
            writer.writerow([code, info.get('clientName', '')])
    print(f"Written {len(clients)} clients to {out_file}")

if __name__ == '__main__':
    main()
