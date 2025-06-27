// Import fungsi yang kita butuhkan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- FUNGSI GLOBAL & HELPERS ---
const showToast = (message, isSuccess = true) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgColor = isSuccess ? 'bg-green-500' : 'bg-red-500';
    toast.className = `w-full max-w-xs p-3 rounded-lg text-white ${bgColor} shadow-lg animate-fade-in-out`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// --- ROUTING & PENGECEKAN AUTENTIKASI ---
const currentPage = window.location.pathname.split('/').pop();

onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html'];
    if (user) {
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        } else if (currentPage === 'dashboard.html') {
            initDashboard(user);
        } else if (currentPage === 'peserta.html') {
            initPesertaPage(user);
        }
    } else {
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
    }
});

// --- LOGIKA HALAMAN LOGIN ---
if (currentPage === 'index.html' || currentPage === '') { /* ... (tidak berubah) ... */ }

// --- LOGIKA HALAMAN DASHBOARD ---
if (currentPage === 'dashboard.html') { /* ... (tidak berubah) ... */ }


// --- LOGIKA HALAMAN PESERTA ---
function initPesertaPage(user) {
    // Inisialisasi Sidebar
    initSidebar(user);

    const pesertaListElement = document.getElementById('peserta-list-manajemen');
    // Modal Tambah/Edit
    const modal = document.getElementById('peserta-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('peserta-form');
    const pesertaIdInput = document.getElementById('peserta-id');
    const namaPesertaInput = document.getElementById('nama-peserta');
    const addBtn = document.getElementById('add-peserta-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    // Modal Hapus
    const deleteModal = document.getElementById('delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    let docIdToDelete = null;

    // --- Fungsi Modal ---
    const showModal = (targetModal) => {
        targetModal.classList.remove('opacity-0', 'pointer-events-none');
        targetModal.querySelector('.modal-content').classList.remove('scale-95');
        document.body.style.overflow = 'hidden';
    };

    const hideModal = (targetModal) => {
        targetModal.classList.add('opacity-0');
        targetModal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            targetModal.classList.add('pointer-events-none');
            document.body.style.overflow = '';
        }, 200);
    };

    // --- Buka Modal Tambah/Edit ---
    addBtn.addEventListener('click', () => {
        form.reset();
        pesertaIdInput.value = '';
        modalTitle.textContent = 'Tambah Peserta Baru';
        showModal(modal);
    });

    const openEditModal = (id, nama) => {
        form.reset();
        pesertaIdInput.value = id;
        namaPesertaInput.value = nama;
        modalTitle.textContent = 'Ubah Nama Peserta';
        showModal(modal);
    };

    // --- Tombol Batal ---
    cancelBtn.addEventListener('click', () => hideModal(modal));
    cancelDeleteBtn.addEventListener('click', () => hideModal(deleteModal));

    // --- Submit Form (Tambah/Edit) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = namaPesertaInput.value;
        const pesertaId = pesertaIdInput.value;

        if (pesertaId) { // Edit
            const docRef = doc(db, 'peserta', pesertaId);
            await updateDoc(docRef, { nama });
            showToast('Data peserta berhasil diperbarui!');
        } else { // Tambah
            await addDoc(collection(db, 'peserta'), {
                nama: nama,
                status_bayar: false,
                status_menang: false,
            });
            showToast('Peserta baru berhasil ditambahkan!');
        }
        hideModal(modal);
        loadPeserta();
    });

    // --- Hapus Peserta ---
    const openDeleteModal = (id) => {
        docIdToDelete = id;
        showModal(deleteModal);
    };

    confirmDeleteBtn.addEventListener('click', async () => {
        if (docIdToDelete) {
            await deleteDoc(doc(db, 'peserta', docIdToDelete));
            showToast('Peserta berhasil dihapus!');
            docIdToDelete = null;
            hideModal(deleteModal);
            loadPeserta();
        }
    });

    // --- Ubah Status ---
    const toggleStatus = async (id, field, currentValue) => {
        const docRef = doc(db, 'peserta', id);
        await updateDoc(docRef, { [field]: !currentValue });
        showToast('Status berhasil diubah.');
        loadPeserta();
    };

    // --- Memuat Data Peserta ---
    const loadPeserta = async () => {
        if (!pesertaListElement) return;
        pesertaListElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Memuat data...</td></tr>`;

        const querySnapshot = await getDocs(collection(db, "peserta"));
        pesertaListElement.innerHTML = '';
        if (querySnapshot.empty) {
            pesertaListElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-slate-50';
            tr.innerHTML = `
                <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                <td class="p-4">
                    <button class="status-bayar-btn inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${data.status_bayar ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${data.status_bayar ? 'Sudah Bayar' : 'Belum Bayar'}
                    </button>
                </td>
                <td class="p-4">
                     <button class="status-menang-btn inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium cursor-pointer ${data.status_menang ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${data.status_menang ? 'Sudah Menang' : 'Belum'}
                    </button>
                </td>
                <td class="p-4 flex items-center gap-2">
                    <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i data-lucide="edit" class="h-4 w-4"></i></button>
                    <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i data-lucide="trash-2" class="h-4 w-4"></i></button>
                </td>
            `;
            // Tambahkan event listeners
            tr.querySelector('.edit-btn').addEventListener('click', () => openEditModal(doc.id, data.nama));
            tr.querySelector('.delete-btn').addEventListener('click', () => openDeleteModal(doc.id));
            tr.querySelector('.status-bayar-btn').addEventListener('click', () => toggleStatus(doc.id, 'status_bayar', data.status_bayar));
            tr.querySelector('.status-menang-btn').addEventListener('click', () => toggleStatus(doc.id, 'status_menang', data.status_menang));

            pesertaListElement.appendChild(tr);
        });
        lucide.createIcons();
    };

    loadPeserta();
}

// --- Fungsi Inisialisasi Umum ---
function initSidebar(user) { /* ... (fungsi dari update sebelumnya) ... */ }
function initDashboard(user) { 
    initSidebar(user);
    // ... sisa logika dashboard
}

// NOTE: Duplikasi fungsi initSidebar dan logika logout ada di kedua halaman.
// Ini bisa di-refactor ke file JS terpisah di proyek yang lebih besar.
// Untuk saat ini, kita akan duplikasi agar setiap halaman mandiri.
const initGenericPage = (user) => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const userEmailElement = document.getElementById('user-email');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');

    const openSidebar = () => { if(mobileSidebar) { document.body.style.overflow = 'hidden'; mobileSidebar.classList.remove('opacity-0', 'pointer-events-none'); sidebarContent.classList.remove('translate-x-full'); } };
    const closeSidebar = () => { if(mobileSidebar) { document.body.style.overflow = ''; sidebarContent.classList.add('translate-x-full'); mobileSidebar.classList.add('opacity-0'); setTimeout(() => mobileSidebar.classList.add('pointer-events-none'), 300); } };
    
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', closeSidebar);
    if (mobileSidebar) mobileSidebar.addEventListener('click', (e) => { if (e.target === mobileSidebar) closeSidebar(); });

    if(userEmailElement) userEmailElement.textContent = user.email;
    const handleLogout = () => signOut(auth);
    if (logoutButtonMobile) logoutButtonMobile.addEventListener('click', handleLogout);
}