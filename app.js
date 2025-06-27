// Import fungsi Firebase yang dibutuhkan
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAWOaZVoiyloMY-UUJHeccEKR9CWYc-d7w",
    authDomain: "arisan-keluarga1.firebaseapp.com",
    projectId: "arisan-keluarga1",
    storageBucket: "arisan-keluarga1.firebasestorage.app",
    messagingSenderId: "345958108395",
    appId: "1:345958108395:web:700efa4296a8c2857142ae",
    measurementId: "G-W3G810D7YL"
};

// --- INISIALISASI ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const currentPage = window.location.pathname.split('/').pop();

// --- FUNGSI HELPERS ---
const showToast = (message, isSuccess = true) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `w-full max-w-xs p-3 rounded-lg text-white ${isSuccess ? 'bg-green-600' : 'bg-red-600'} shadow-lg`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- LOGIKA UTAMA & ROUTING ---
console.log("App loaded, checking auth state...");
onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html'];
    if (user) {
        console.log("Auth state: User is logged in.", user.email);
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
            return;
        }
        initCommonElements(user);
        if (currentPage === 'dashboard.html') initDashboardPage();
        if (currentPage === 'peserta.html') initPesertaPage();
    } else {
        console.log("Auth state: User is logged out.");
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
            return;
        }
        initLoginPage();
    }
});

// --- INISIALISASI HALAMAN LOGIN ---
function initLoginPage() {
    console.log("Initializing Login Page...");
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = '';
            console.log(`Attempting to sign in with email: ${email}`);
            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("Sign in successful!", userCredential.user.email);
                })
                .catch((error) => {
                    console.error("Sign in failed:", error);
                    errorMessage.textContent = 'Email atau password salah.';
                });
        });
    }
}

// --- INISIALISASI ELEMEN UMUM (SETELAH LOGIN) ---
function initCommonElements(user) {
    console.log("Initializing common elements (sidebar, logout)...");
    // ... (kode ini tidak berubah) ...
}

// --- INISIALISASI HALAMAN DASHBOARD ---
function initDashboardPage() {
    console.log("Initializing Dashboard Page...");
    // ... (kode ini tidak berubah) ...
}

// --- INISIALISASI HALAMAN PESERTA ---
function initPesertaPage() {
    console.log("Initializing Peserta Page...");
    const listBody = document.getElementById('peserta-list-manajemen');
    const totalText = document.getElementById('total-peserta-text');
    const modal = document.getElementById('peserta-modal');
    const deleteModal = document.getElementById('delete-modal');
    const form = document.getElementById('peserta-form');
    const idInput = document.getElementById('peserta-id');
    const nameInput = document.getElementById('nama-peserta');
    const bayarToggle = document.getElementById('status-bayar-toggle');
    const menangToggle = document.getElementById('status-menang-toggle');
    let docIdToDelete = null;

    const showModal = (target) => { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); };
    const hideModal = (target) => { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); };
    
    document.getElementById('add-peserta-btn').addEventListener('click', () => {
        form.reset();
        idInput.value = '';
        document.getElementById('modal-title').textContent = 'Tambah Peserta Baru';
        showModal(modal);
    });
    document.getElementById('cancel-btn').addEventListener('click', () => hideModal(modal));
    document.getElementById('cancel-delete-btn').addEventListener('click', () => hideModal(deleteModal));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const dataToSave = {
            nama: nameInput.value,
            status_bayar: bayarToggle.checked,
            status_menang: menangToggle.checked
        };
        const id = idInput.value;
        console.log(`Form submitted. Mode: ${id ? 'Edit' : 'Add'}`);
        console.log("Data to save:", dataToSave);
        
        try {
            if (id) {
                await updateDoc(doc(db, 'peserta', id), dataToSave);
                showToast('Data berhasil diperbarui!');
                console.log(`Participant ${id} updated successfully.`);
            } else {
                // Untuk peserta baru, pastikan field 'aktif' ada
                const newData = { ...dataToSave, aktif: true };
                const docRef = await addDoc(collection(db, 'peserta'), newData);
                showToast('Peserta baru ditambahkan!');
                console.log(`New participant added successfully with ID: ${docRef.id}`);
            }
            hideModal(modal);
            loadPeserta();
        } catch (error) {
            console.error("ERROR SAVING PARTICIPANT:", error);
            showToast('Terjadi kesalahan saat menyimpan', false);
        }
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!docIdToDelete) return;
        console.log(`Attempting to delete participant with ID: ${docIdToDelete}`);
        try {
            await deleteDoc(doc(db, 'peserta', docIdToDelete));
            showToast('Peserta berhasil dihapus!');
            console.log(`Participant ${docIdToDelete} deleted successfully.`);
            hideModal(deleteModal);
            loadPeserta();
        } catch (error) {
            console.error("ERROR DELETING PARTICIPANT:", error);
            showToast('Gagal menghapus', false);
        }
    });

    const loadPeserta = async () => {
        console.log("loadPeserta: Function started.");
        if (!listBody) {
            console.error("loadPeserta: Table body with id 'peserta-list-manajemen' not found!");
            return;
        }
        listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Memuat data peserta...</td></tr>`;
        
        try {
            console.log("loadPeserta: Fetching data from Firestore collection 'peserta'...");
            const querySnapshot = await getDocs(collection(db, "peserta"));
            console.log(`loadPeserta: Fetch successful. Found ${querySnapshot.size} documents.`);
            
            listBody.innerHTML = '';
            totalText.textContent = `Total ${querySnapshot.size} anggota aktif.`;
            
            if (querySnapshot.empty) {
                console.log("loadPeserta: No participants found.");
                listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
                return;
            }

            querySnapshot.forEach(d => {
                const data = d.data();
                console.log(`loadPeserta: Rendering participant - ${data.nama}`);
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${data.status_menang ? 'Sudah' : 'Belum'}</span></td>
                    <td class="p-4 text-right">
                        <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button>
                        <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button>
                    </td>
                `;
                tr.querySelector('.edit-btn').addEventListener('click', () => {
                    idInput.value = d.id;
                    nameInput.value = data.nama;
                    bayarToggle.checked = !!data.status_bayar;
                    menangToggle.checked = !!data.status_menang;
                    document.getElementById('modal-title').textContent = 'Ubah Data Peserta';
                    showModal(modal);
                });
                tr.querySelector('.delete-btn').addEventListener('click', () => { docIdToDelete = d.id; showModal(deleteModal); });
            });
            lucide.createIcons();
            console.log("loadPeserta: All participants rendered.");
        } catch (error) {
            console.error("ERROR LOADING PESERTA:", error);
            listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Terjadi kesalahan saat memuat data.</td></tr>`;
        }
    };

    loadPeserta();
}