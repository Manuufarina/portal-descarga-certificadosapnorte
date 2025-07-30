# Portal Descarga Certificados

Utilidad simple para gestionar y descargar certificados en formato PDF.

## Actualizar listado de clientes

Se proveen dos scripts Node en la carpeta `scripts`:

- `update_sample_csv.js`: genera `data/clients_sample.csv` a partir de `data/clients.json` con todos los clientes cargados.
- `apply_csv_update.js`: lee un archivo CSV con columnas `accessCode` y `clientName` y actualiza `data/clients.json`, añadiendo los clientes que falten o actualizando los existentes.

Ejemplo de uso para actualizar los clientes desde un CSV:

```bash
node scripts/apply_csv_update.js ruta/al/archivo.csv
```

Luego ejecute `node scripts/update_sample_csv.js` para regenerar el archivo de muestra.

