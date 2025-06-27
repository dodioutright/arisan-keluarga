import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const currentPage = window.location.pathname.split('/').pop();

const showToast = (message, isSuccess = true) => {
    // Implementasi Toast
};

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

function initPesertaPage() {
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
        const data = {
            nama: nameInput.value,
            status_bayar: bayarToggle.checked,
            status_menang: menangToggle.checked
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
        if (!listBody) return;
        listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Memuat...</td></tr>`;
        const snap = await getDocs(collection(db, "peserta"));
        listBody.innerHTML = '';
        totalText.textContent = `Total ${snap.size} anggota aktif.`;
        if (snap.empty) {
            listBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
            return;
        }

        snap.forEach(d => {
            const data = d.data();
            const tr = listBody.insertRow();
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
                bayarToggle.checked = data.status_bayar;
                menangToggle.checked = data.status_menang;
                document.getElementById('modal-title').textContent = 'Ubah Data Peserta';
                showModal(modal);
            });
            tr.querySelector('.delete-btn').addEventListener('click', () => { docIdToDelete = d.id; showModal(deleteModal); });
        });
        lucide.createIcons();
    };
    loadPeserta();
}