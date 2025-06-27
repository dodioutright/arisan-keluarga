// Import fungsi Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- FUNGSI HELPERS ---
const showToast = (message, isSuccess = true) => { /* ... (tidak berubah) ... */ };

// --- LOGIKA UTAMA & ROUTING ---
const currentPage = window.location.pathname.split('/').pop();

onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html'];
    if (user) {
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        } else {
            initCommonElements(user);
            if (currentPage === 'dashboard.html') initDashboardPage();
            if (currentPage === 'peserta.html') initPesertaPage();
        }
    } else {
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'index.html';
        } else if (currentPage === 'index.html' || currentPage === '') {
            initLoginPage();
        }
    }
});

// --- INISIALISASI HALAMAN LOGIN ---
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';
        signInWithEmailAndPassword(auth, email, password)
            .catch(() => errorMessage.textContent = 'Email atau password salah.');
    });
}

// --- INISIALISASI ELEMEN UMUM (SETELAH LOGIN) ---
function initCommonElements(user) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const openSidebar = () => { if(mobileSidebar) { document.body.style.overflow = 'hidden'; mobileSidebar.classList.remove('opacity-0', 'pointer-events-none'); sidebarContent.classList.remove('translate-x-full'); }};
    const closeSidebar = () => { if(mobileSidebar) { document.body.style.overflow = ''; sidebarContent.classList.add('translate-x-full'); mobileSidebar.classList.add('opacity-0'); setTimeout(() => mobileSidebar.classList.add('pointer-events-none'), 300); }};
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', closeSidebar);
    if (mobileSidebar) mobileSidebar.addEventListener('click', (e) => { if (e.target === mobileSidebar) closeSidebar(); });

    const handleLogout = () => signOut(auth);
    const logoutDesktop = document.getElementById('logout-button-desktop');
    const logoutMobile = document.getElementById('logout-button-mobile');
    if (logoutDesktop) logoutDesktop.addEventListener('click', handleLogout);
    if (logoutMobile) logoutMobile.addEventListener('click', handleLogout);

    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) userEmailElement.textContent = user.email;
}

// --- INISIALISASI HALAMAN DASHBOARD ---
function initDashboardPage() {
    const totalPesertaCard = document.getElementById('total-peserta-card');
    
    const loadDashboardStats = async () => {
        if (!totalPesertaCard) return;
        try {
            const querySnapshot = await getDocs(collection(db, "peserta"));
            totalPesertaCard.textContent = `${querySnapshot.size} Orang`;
        } catch (error) {
            console.error("Gagal memuat statistik dashboard:", error);
            totalPesertaCard.textContent = `Error`;
        }
    };
    
    loadDashboardStats();
}

// --- INISIALISASI HALAMAN PESERTA ---
function initPesertaPage() {
    // ... (Logika untuk halaman peserta tidak berubah) ...
    const listElement = document.getElementById('peserta-list-manajemen');
    const modal = document.getElementById('peserta-modal');
    const deleteModal = document.getElementById('delete-modal');
    let docIdToDelete = null;

    const showModal = (target) => { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); document.body.style.overflow = 'hidden'; };
    const hideModal = (target) => { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => { target.classList.add('pointer-events-none'); document.body.style.overflow = ''; }, 300); };
    
    document.getElementById('add-peserta-btn').addEventListener('click', () => {
        const form = document.getElementById('peserta-form');
        form.reset();
        document.getElementById('peserta-id').value = '';
        document.getElementById('modal-title').textContent = 'Tambah Peserta Baru';
        showModal(modal);
    });
    document.getElementById('cancel-btn').addEventListener('click', () => hideModal(modal));
    document.getElementById('cancel-delete-btn').addEventListener('click', () => hideModal(deleteModal));

    document.getElementById('peserta-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nama = e.target['nama-peserta'].value;
        const id = e.target['peserta-id'].value;
        try {
            if (id) {
                await updateDoc(doc(db, 'peserta', id), { nama });
                showToast('Data berhasil diperbarui!');
            } else {
                await addDoc(collection(db, 'peserta'), { nama, status_bayar: false, status_menang: false });
                showToast('Peserta baru ditambahkan!');
            }
            hideModal(modal);
            loadPeserta();
        } catch (error) { showToast('Terjadi kesalahan', false); }
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!docIdToDelete) return;
        try {
            await deleteDoc(doc(db, 'peserta', docIdToDelete));
            showToast('Peserta berhasil dihapus!');
            hideModal(deleteModal);
            loadPeserta();
        } catch (error) { showToast('Gagal menghapus', false); }
    });

    const loadPeserta = async () => {
        if (!listElement) return;
        listElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Memuat...</td></tr>`;
        const querySnapshot = await getDocs(collection(db, "peserta"));
        listElement.innerHTML = '';
        if(querySnapshot.empty) {
            listElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
            return;
        }

        querySnapshot.forEach(d => {
            const data = d.data();
            const tr = listElement.insertRow();
            tr.className = 'hover:bg-slate-50';
            const rowContent = `
                <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                <td class="p-4"><button data-field="status_bayar" class="status-btn inline-flex items-center rounded-full px-2.5 py-0.5 text-xs cursor-pointer ${data.status_bayar ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}">${data.status_bayar ? 'Sudah Bayar' : 'Belum Bayar'}</button></td>
                <td class="p-4"><button data-field="status_menang" class="status-btn inline-flex items-center rounded-full px-2.5 py-0.5 text-xs cursor-pointer ${data.status_menang ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">${data.status_menang ? 'Sudah Menang' : 'Belum'}</button></td>
                <td class="p-4 flex items-center gap-2">
                    <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i data-lucide="edit" class="h-4 w-4 pointer-events-none"></i></button>
                    <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>
                </td>
            `;
            tr.innerHTML = rowContent;

            tr.querySelector('.edit-btn').addEventListener('click', () => {
                document.getElementById('peserta-form').reset();
                document.getElementById('peserta-id').value = d.id;
                document.getElementById('nama-peserta').value = data.nama;
                document.getElementById('modal-title').textContent = 'Ubah Nama Peserta';
                showModal(modal);
            });
            tr.querySelector('.delete-btn').addEventListener('click', () => { docIdToDelete = d.id; showModal(deleteModal); });
            tr.querySelectorAll('.status-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const field = btn.dataset.field;
                    await updateDoc(doc(db, 'peserta', d.id), { [field]: !data[field] });
                    // showToast('Status berhasil diubah.'); // Dihilangkan agar tidak terlalu ramai notifikasi
                    loadPeserta();
                });
            });
        });
        lucide.createIcons();
    };

    loadPeserta();
}