document.addEventListener('DOMContentLoaded', () => {
    // Firebase services
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // App sections
    const mainView = document.getElementById('main-view');
    const adminDashboard = document.getElementById('admin-dashboard');
    const clientView = document.getElementById('client-view');
    const adminLoginView = document.getElementById('admin-login-view');

    // --- AUTHENTICATION ---

    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in, show admin dashboard
            mainView.classList.add('hidden');
            adminDashboard.classList.remove('hidden');
            // Initialize admin panel data
            loadClientsForPasswordManagement();
            loadClientsForFileManagement();
        } else {
            // User is signed out, show main login view
            mainView.classList.remove('hidden');
            adminDashboard.classList.add('hidden');
        }
    });

    // Admin Login
    document.getElementById('admin-login-form').addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('admin-email').value.trim();
        const password = document.getElementById('admin-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .catch(error => {
                console.error("Login failed:", error);
                alert('Credenciales incorrectas o error de conexión.');
            });
    });

    // Admin Logout
    document.getElementById('btn-admin-logout').addEventListener('click', () => {
        auth.signOut();
    });

    // --- UI/UX Functions ---

    // Tab switching for main view (Client vs Admin)
    const tabClient = document.getElementById('tab-client');
    const tabAdminLogin = document.getElementById('tab-admin-login');

    tabClient.addEventListener('click', () => {
        clientView.classList.remove('hidden');
        adminLoginView.classList.add('hidden');
        tabClient.classList.add('tab-active');
        tabAdminLogin.classList.remove('tab-active');
    });

    tabAdminLogin.addEventListener('click', () => {
        clientView.classList.add('hidden');
        adminLoginView.classList.remove('hidden');
        tabClient.classList.remove('tab-active');
        tabAdminLogin.classList.add('tab-active');
    });

    // Tab switching for Admin Dashboard
    const adminTabs = document.querySelectorAll('.admin-tab-button');
    const adminTabContents = {
        upload: document.getElementById('admin-upload-view'),
        passwords: document.getElementById('admin-passwords-view'),
        clients: document.getElementById('admin-clients-view'),
    };

    function switchAdminTab(tabName) {
        Object.values(adminTabContents).forEach(content => content.classList.add('hidden'));
        adminTabs.forEach(button => button.classList.remove('admin-tab-active'));

        adminTabContents[tabName].classList.remove('hidden');
        document.querySelector(`.admin-tab-button[data-tab="${tabName}"]`).classList.add('admin-tab-active');
    }

    adminTabs.forEach(button => {
        button.addEventListener('click', () => switchAdminTab(button.dataset.tab));
    });

    document.getElementById('admin-tabs-select').addEventListener('change', (e) => {
        switchAdminTab(e.target.value);
    });


    // --- CLIENT VIEW LOGIC ---
    function renderClientFiles(clientData) {
        const container = document.getElementById('client-files-container');
        let html = `<h3 class="text-xl font-semibold mb-4 text-white">Documentos de: ${clientData.clientName}</h3>`;

        if (!clientData.files || clientData.files.length === 0) {
            html += '<p class="text-gray-400">No hay archivos disponibles.</p>';
        } else {
            // Sort files by date, newest first
            clientData.files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

            html += '<ul class="space-y-3">';
            clientData.files.forEach(file => {
                html += `<li class="bg-gray-700 p-4 rounded-md flex items-center justify-between">
                    <div>
                        <p class="font-medium text-white">${file.fileName}</p>
                        <p class="text-sm text-gray-400">Fecha: ${file.uploadDate}</p>
                    </div>
                    <a href="${file.fileURL}" download="${file.fileName}" target="_blank" rel="noopener" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition">Descargar</a>
                </li>`;
            });
            html += '</ul>';
        }
        container.innerHTML = html;
    }

    document.getElementById('btn-access-files').addEventListener('click', () => {
        const code = document.getElementById('access-code').value.trim().toUpperCase();
        const container = document.getElementById('client-files-container');

        if (!code) {
            alert('Por favor, ingrese un código de acceso.');
            return;
        }

        container.innerHTML = '<p class="text-center text-gray-400">Buscando...</p>';

        db.collection('clients').where('accessCode', '==', code).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    container.innerHTML = '';
                    alert('Código de acceso incorrecto o no encontrado.');
                } else {
                    // Assuming access codes are unique, take the first result
                    const clientData = snapshot.docs[0].data();
                    renderClientFiles(clientData);
                }
            })
            .catch(error => {
                console.error("Error fetching client data:", error);
                container.innerHTML = '';
                alert('Hubo un error al consultar los datos. Intente de nuevo.');
            });
    });

    // --- ADMIN DASHBOARD LOGIC ---

    // Section: Manage Passwords (Clients)
    const passwordList = document.getElementById('password-list');
    const clientNameInput = document.getElementById('pwd-client-name');
    const accessCodeInput = document.getElementById('pwd-access-code');
    const savePasswordBtn = document.getElementById('btn-save-password');
    let editingClientId = null;

    // READ clients for the password management list
    async function loadClientsForPasswordManagement() {
        passwordList.innerHTML = 'Cargando...';
        try {
            const snapshot = await db.collection('clients').orderBy('clientName').get();
            if (snapshot.empty) {
                passwordList.innerHTML = '<p class="text-gray-400">No hay clientes registrados.</p>';
                return;
            }
            let html = '';
            snapshot.forEach(doc => {
                const client = doc.data();
                html += `
                    <div class="bg-gray-800 p-3 rounded-md flex justify-between items-center">
                        <div>
                            <p class="font-semibold">${client.clientName}</p>
                            <p class="text-sm text-gray-400">${client.accessCode}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="edit-client-btn text-blue-400 hover:text-blue-300" data-id="${doc.id}">Editar</button>
                            <button class="delete-client-btn text-red-400 hover:text-red-300" data-id="${doc.id}">Borrar</button>
                        </div>
                    </div>
                `;
            });
            passwordList.innerHTML = html;
        } catch (error) {
            console.error("Error loading clients:", error);
            passwordList.innerHTML = '<p class="text-red-400">Error al cargar clientes.</p>';
        }
    }

    // Event delegation for edit/delete buttons
    passwordList.addEventListener('click', async (e) => {
        const target = e.target;
        const clientId = target.dataset.id;
        if (!clientId) return;

        if (target.classList.contains('edit-client-btn')) {
            const clientDoc = await db.collection('clients').doc(clientId).get();
            if (clientDoc.exists) {
                const client = clientDoc.data();
                clientNameInput.value = client.clientName;
                accessCodeInput.value = client.accessCode;
                editingClientId = clientId;
                savePasswordBtn.textContent = 'Actualizar Cliente';
                savePasswordBtn.classList.replace('bg-blue-600', 'bg-yellow-600');
            }
        } else if (target.classList.contains('delete-client-btn')) {
            showModal('¿Está seguro que desea eliminar este cliente? Esta acción no se puede deshacer.', () => deleteClient(clientId));
        }
    });

    // Bulk CREATE from CSV
    const csvFileInput = document.getElementById('csv-file-upload');
    const bulkClientUploadBtn = document.getElementById('btn-bulk-client-upload');
    const bulkClientUploadStatus = document.getElementById('bulk-client-upload-status');

    bulkClientUploadBtn.addEventListener('click', () => {
        const file = csvFileInput.files[0];
        if (!file) {
            alert('Por favor, seleccione un archivo CSV.');
            return;
        }

        bulkClientUploadBtn.disabled = true;
        bulkClientUploadStatus.textContent = 'Procesando archivo...';

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                let successCount = 0;
                let errorCount = 0;

                for (const row of results.data) {
                    const clientName = row.nombre_cliente;
                    const accessCode = row.codigo_acceso;

                    if (clientName && accessCode) {
                        try {
                            await db.collection('clients').add({
                                clientName: clientName.trim(),
                                accessCode: accessCode.trim().toUpperCase(),
                                files: []
                            });
                            successCount++;
                        } catch (e) {
                            console.error("Error adding client from CSV:", e);
                            errorCount++;
                        }
                    } else {
                        errorCount++;
                    }
                }

                let statusMessage = `Carga completada. Clientes añadidos: ${successCount}.`;
                if (errorCount > 0) {
                    statusMessage += ` Filas con errores: ${errorCount}.`;
                }
                bulkClientUploadStatus.textContent = statusMessage;

                csvFileInput.value = ''; // Reset input
                bulkClientUploadBtn.disabled = false;
                loadClientsForPasswordManagement(); // Refresh the list
            },
            error: (err) => {
                bulkClientUploadStatus.textContent = `Error al parsear el CSV: ${err.message}`;
                bulkClientUploadBtn.disabled = false;
            }
        });
    });

    // CREATE/UPDATE client (individual)
    savePasswordBtn.addEventListener('click', async () => {
        const clientName = clientNameInput.value.trim();
        const accessCode = accessCodeInput.value.trim().toUpperCase();

        if (!clientName || !accessCode) {
            alert('El nombre y el código de acceso son obligatorios.');
            return;
        }

        try {
            if (editingClientId) {
                // Update
                await db.collection('clients').doc(editingClientId).update({ clientName, accessCode });
                alert('Cliente actualizado con éxito.');
            } else {
                // Create
                await db.collection('clients').add({
                    clientName,
                    accessCode,
                    files: [] // Initialize with an empty files array
                });
                alert('Cliente añadido con éxito.');
            }
            resetPasswordForm();
            loadClientsForPasswordManagement();
        } catch (error) {
            console.error('Error saving client:', error);
            alert('Error al guardar el cliente.');
        }
    });

    function resetPasswordForm() {
        clientNameInput.value = '';
        accessCodeInput.value = '';
        editingClientId = null;
        savePasswordBtn.textContent = 'Guardar Cliente';
        savePasswordBtn.classList.replace('bg-yellow-600', 'bg-blue-600');
    }

    // DELETE client
    async function deleteClient(clientId) {
        try {
            await db.collection('clients').doc(clientId).delete();
            alert('Cliente eliminado con éxito.');
            loadClientsForPasswordManagement();
        } catch (error) {
            console.error("Error deleting client:", error);
            alert('Error al eliminar el cliente.');
        }
    }


    // Section: Bulk File Upload
    const bulkFileUploadInput = document.getElementById('bulk-file-upload');
    const bulkUploadBtn = document.getElementById('btn-bulk-upload');
    const bulkUploadStatus = document.getElementById('bulk-upload-status');

    bulkUploadBtn.addEventListener('click', async () => {
        const files = bulkFileUploadInput.files;
        if (files.length === 0) {
            alert('Por favor, seleccione uno o más archivos PDF.');
            return;
        }

        bulkUploadBtn.disabled = true;
        bulkUploadStatus.innerHTML = ''; // Clear previous statuses

        for (const file of files) {
            if (file.type !== 'application/pdf') {
                logStatus(`Archivo omitido (no es PDF): ${file.name}`, 'text-yellow-400');
                continue;
            }

            logStatus(`Procesando: ${file.name}...`);

            // Extract client name (part before " - ")
            const parts = file.name.replace('.pdf', '').split(' - ');
            if (parts.length < 2) {
                logStatus(`Error: El nombre del archivo "${file.name}" no tiene el formato correcto (Cliente - Detalle.pdf).`, 'text-red-400');
                continue;
            }
            const clientName = parts[0].trim();

            try {
                // Find client by name
                const snapshot = await db.collection('clients').where('clientName', '==', clientName).get();

                if (snapshot.empty) {
                    logStatus(`Error: No se encontró el cliente "${clientName}" en la base de datos.`, 'text-red-400');
                    continue;
                }
                if (snapshot.size > 1) {
                    logStatus(`Error: Múltiples clientes encontrados con el nombre "${clientName}". No se puede subir el archivo.`, 'text-red-400');
                    continue;
                }

                const clientDoc = snapshot.docs[0];
                const clientId = clientDoc.id;

                // Upload to Firebase Storage
                const storageRef = storage.ref(`client_files/${clientId}/${file.name}`);
                const uploadTask = await storageRef.put(file);
                const downloadURL = await uploadTask.ref.getDownloadURL();

                // Update Firestore document
                const newFileData = {
                    fileName: file.name,
                    fileURL: downloadURL,
                    uploadDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD
                };

                await db.collection('clients').doc(clientId).update({
                    files: firebase.firestore.FieldValue.arrayUnion(newFileData)
                });

                logStatus(`Éxito: "${file.name}" subido y asociado a ${clientName}.`, 'text-green-400');

            } catch (error) {
                console.error(`Error procesando ${file.name}:`, error);
                logStatus(`Error crítico al procesar "${file.name}". Revise la consola.`, 'text-red-500');
            }
        }

        logStatus('--- Carga Masiva Completada ---', 'font-bold');
        bulkUploadBtn.disabled = false;
        bulkFileUploadInput.value = ''; // Reset file input
    });

    function logStatus(message, className = 'text-gray-300') {
        const p = document.createElement('p');
        p.className = `text-sm ${className}`;
        p.textContent = message;
        bulkUploadStatus.appendChild(p);
        bulkUploadStatus.scrollTop = bulkUploadStatus.scrollHeight; // Auto-scroll
    }


    // Section: Manage Clients and Files
    const clientManagementList = document.getElementById('client-management-list');

    async function loadClientsForFileManagement() {
        clientManagementList.innerHTML = 'Cargando...';
        try {
            const snapshot = await db.collection('clients').orderBy('clientName').get();
            if (snapshot.empty) {
                clientManagementList.innerHTML = '<p class="text-gray-400">No hay clientes para mostrar.</p>';
                return;
            }

            let html = snapshot.docs.map(doc => {
                const client = doc.data();
                const clientId = doc.id;

                let filesHtml = '<p class="text-sm text-gray-500 pl-4">No hay archivos.</p>';
                if (client.files && client.files.length > 0) {
                    // Sort files by date before rendering
                    client.files.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
                    filesHtml = '<ul class="space-y-2 mt-2">';
                    filesHtml += client.files.map(file => `
                        <li class="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                            <span class="text-sm">${file.fileName} (${file.uploadDate})</span>
                            <button class="delete-file-btn text-red-500 hover:text-red-400 text-xs py-1 px-2" data-client-id="${clientId}" data-file-url="${file.fileURL}">
                                Borrar
                            </button>
                        </li>
                    `).join('');
                    filesHtml += '</ul>';
                }

                return `
                    <div class="bg-gray-800 p-4 rounded-lg">
                        <h4 class="font-bold text-lg">${client.clientName}</h4>
                        ${filesHtml}
                    </div>
                `;
            }).join('');

            clientManagementList.innerHTML = html;
        } catch (error) {
            console.error("Error loading clients for file management:", error);
            clientManagementList.innerHTML = '<p class="text-red-400">Error al cargar la lista de clientes y archivos.</p>';
        }
    }

    clientManagementList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-file-btn')) {
            const btn = e.target;
            const clientId = btn.dataset.clientId;
            const fileURL = btn.dataset.fileUrl;

            showModal('¿Seguro que desea eliminar este archivo? Esta acción es permanente.', () => {
                deleteFile(clientId, fileURL);
            });
        }
    });

    async function deleteFile(clientId, fileURL) {
        // 1. Delete file from Firebase Storage
        try {
            const fileRef = storage.refFromURL(fileURL);
            await fileRef.delete();
        } catch (error) {
            // If file not found, it might be an orphan entry. Log and continue.
            console.warn(`Could not delete file from Storage (may already be deleted): ${fileURL}`, error);
        }

        // 2. Remove file reference from Firestore
        try {
            const clientRef = db.collection('clients').doc(clientId);
            const clientDoc = await clientRef.get();
            if (clientDoc.exists) {
                const clientData = clientDoc.data();
                const updatedFiles = clientData.files.filter(file => file.fileURL !== fileURL);
                await clientRef.update({ files: updatedFiles });
                alert('Archivo eliminado con éxito.');
                loadClientsForFileManagement(); // Refresh the view
            }
        } catch (error) {
            console.error("Error updating Firestore document:", error);
            alert('Error al eliminar la referencia del archivo en la base de datos.');
        }
    }

    // --- MODAL LOGIC ---
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    let confirmCallback = null;

    function showModal(message, onConfirm) {
        modalMessage.textContent = message;
        confirmCallback = onConfirm;
        modal.classList.remove('hidden');
    }

    modalConfirmBtn.addEventListener('click', () => {
        if (confirmCallback) {
            confirmCallback();
        }
        modal.classList.add('hidden');
    });

    modalCancelBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
});
