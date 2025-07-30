# Portal Descarga Certificados

Utilidad simple para gestionar y descargar certificados en formato PDF.

## Configuración de Firebase

El portal utiliza Firebase Firestore como base de datos. Es necesario
proporcionar la configuración de tu proyecto en el bloque `firebaseConfig`
dentro de `index.html`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyAw0POKFHZkLMJdOvTnqlc4B2jMHaUdC44",
  authDomain: "portal-certificados-antiplaga.firebaseapp.com",
  projectId: "portal-certificados-antiplaga",
  storageBucket: "portal-certificados-antiplaga.firebasestorage.app",
  messagingSenderId: "1027821457649",
  appId: "1:1027821457649:web:4a649763d0505db83c9950"
};
```

Asegúrate de reemplazar los valores de ejemplo por los de tu proyecto antes de
subir la aplicación a producción.

## Actualizar listado de clientes

Se proveen dos scripts Node en la carpeta `scripts`:

- `update_sample_csv.js`: genera `data/clients_sample.csv` a partir de `data/clients.json` con todos los clientes cargados.
- `apply_csv_update.js`: lee un archivo CSV con columnas `accessCode` y `clientName` y actualiza `data/clients.json`, añadiendo los clientes que falten o actualizando los existentes.

Ejemplo de uso para actualizar los clientes desde un CSV:

```bash
node scripts/apply_csv_update.js ruta/al/archivo.csv
```

Luego ejecute `node scripts/update_sample_csv.js` para regenerar el archivo de muestra.

