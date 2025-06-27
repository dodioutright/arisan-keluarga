// Import fungsi Firebase yang dibutuhkan, termasuk query dan where
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- FUNGSI HELPERS ---
const showToast = (message, isSuccess = true) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
    toast.className = `w-full max-w-xs p-3 rounded-lg text-white ${bgColor} shadow-lg transition-all duration-300 transform-gpu animate-toast-in`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

// --- LOGIKA UTAMA & ROUTING ---
const currentPage = window.location.pathname.split('/').pop();

onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html'];
    if (user) {
        if (currentPage === 'index.html' || currentPage === '') { window.location.href = 'dashboard.html'; return; }
        initCommonElements(user);
        if (currentPage === 'dashboard.html') initDashboardPage();
        if (currentPage === 'peserta.html') initPesertaPage();
    } else {
        if (protectedPages.includes(currentPage)) { window.location.href = 'index.html'; return; }
        initLoginPage();
    }
});

// --- INISIALISASI HALAMAN LOGIN ---
function initLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
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
}

// --- INISIALISASI ELEMEN UMUM (SETELAH LOGIN) ---
function initCommonElements(user) {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    
    const openSidebar = () => { if(mobileSidebar) { document.body.style.overflow = 'hidden'; mobileSidebar.classList.remove('opacity-0', 'pointer-events-none'); sidebarContent.classList.remove('translate-x-full'); } };
    const closeSidebar = () => { if(mobileSidebar) { document.body.style.overflow = ''; sidebarContent.classList.add('translate-x-full'); mobileSidebar.classList.add('opacity-0'); setTimeout(() => mobileSidebar.classList.add('pointer-events-none'), 300); } };

    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', closeSidebar);
    if (mobileSidebar) mobileSidebar.addEventListener('click', (e) => { if (e.target === mobileSidebar) closeSidebar(); });

    const handleLogout = () => signOut(auth);
    document.getElementById('logout-button-desktop')?.addEventListener('click', handleLogout);
    document.getElementById('logout-button-mobile')?.addEventListener('click', handleLogout);

    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) userEmailElement.textContent = user.email;
}

// --- INISIALISASI HALAMAN DASHBOARD ---
function initDashboardPage() {
    const totalPesertaCard = document.getElementById('total-peserta-card');
    const loadStats = async () => {
        if (!totalPesertaCard) return;
        try {
            const snap = await getDocs(collection(db, "peserta"));
            totalPesertaCard.textContent = `${snap.size} Orang`;
        } catch (error) { totalPesertaCard.textContent = `Error`; }
    };
    loadStats();
}

// --- INISIALISASI HALAMAN PESERTA (DIOPTIMALKAN) ---
function initPesertaPage() {
    const listBody = document.getElementById('peserta-list-manajemen');
    const skeletonBody = document.getElementById('peserta-list-skeleton');
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
    
    const invalidateCacheAndReload = () => {
        localStorage.removeItem('pesertaCache');
        listBody.classList.add('hidden');
        skeletonBody.classList.remove('hidden');
        loadPeserta();
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nama: nameInput.value,
            status_bayar: bayarToggle.checked,
            status_menang: menangToggle.checked,
            aktif: true // Pastikan peserta baru selalu aktif
        };
        const id = idInput.value;
        try {
            if (id) {
                await updateDoc(doc(db, 'peserta', id), data);
                showToast('Data berhasil diperbarui!');
            } else {
                await addDoc(collection(db, 'peserta'), data);
                showToast('Peserta baru ditambahkan!');
            }
            hideModal(modal);
            invalidateCacheAndReload();
        } catch (error) { showToast('Terjadi kesalahan', false); }
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!docIdToDelete) return;
        try {
            await deleteDoc(doc(db, 'peserta', docIdToDelete));
            showToast('Peserta berhasil dihapus!');
            hideModal(deleteModal);
            invalidateCacheAndReload();
        } catch (error) { showToast('Gagal menghapus', false); }
    });

    const renderPesertaTable = (pesertaArray) => {
        if (!listBody || !skeletonBody) return;
        listBody.innerHTML = '';
        if (pesertaArray.length === 0) {
            listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
        } else {
            pesertaArray.forEach(peserta => {
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-4 font-medium text-slate-800">${peserta.nama}</td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${peserta.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${peserta.status_menang ? 'Sudah' : 'Belum'}</span></td>
                    <td class="p-4 text-right">
                        <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button>
                        <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button>
                    </td>
                `;
                tr.querySelector('.edit-btn').addEventListener('click', () => {
                    idInput.value = peserta.id;
                    nameInput.value = peserta.nama;
                    bayarToggle.checked = peserta.status_bayar;
                    menangToggle.checked = peserta.status_menang;
                    document.getElementById('modal-title').textContent = 'Ubah Data Peserta';
                    showModal(modal);
                });
                tr.querySelector('.delete-btn').addEventListener('click', () => { docIdToDelete = peserta.id; showModal(deleteModal); });
            });
        }
        listBody.classList.remove('hidden');
        skeletonBody.classList.add('hidden');
        lucide.createIcons();
    };

    const loadPeserta = async () => {
        const cachedDataString = localStorage.getItem('pesertaCache');
        if (cachedDataString) {
            const data = JSON.parse(cachedDataString);
            totalText.textContent = `Total ${data.length} anggota aktif.`;
            renderPesertaTable(data);
        } else {
            skeletonBody.classList.remove('hidden');
        }

        try {
            const q = query(collection(db, "peserta"), where("aktif", "==", true));
            const snap = await getDocs(q);
            const freshData = [];
            snap.forEach(d => freshData.push({ id: d.id, ...d.data() }));
            
            totalText.textContent = `Total ${freshData.length} anggota aktif.`;
            renderPesertaTable(freshData);
            localStorage.setItem('pesertaCache', JSON.stringify(freshData));
        } catch (error) {
            console.error("Gagal memuat data dari Firebase:", error);
            showToast("Gagal memuat data terbaru.", false);
            skeletonBody.classList.add('hidden');
            if (!cachedDataString) listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        }
    };

    loadPeserta();
}