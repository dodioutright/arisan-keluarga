// Import fungsi Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html', 'pengaturan.html'];
    if (user) {
        if (currentPage === 'index.html' || currentPage === '') { window.location.href = 'dashboard.html'; return; }
        initCommonElements(user);
        if (currentPage === 'dashboard.html') initDashboardPage();
        if (currentPage === 'peserta.html') initPesertaPage();
        if (currentPage === 'pengaturan.html') initPengaturanPage();
    } else {
        if (protectedPages.includes(currentPage)) { window.location.href = 'index.html'; return; }
        if (currentPage === 'index.html' || currentPage === '') initLoginPage();
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
                .catch((error) => {
                    console.error("Login Error:", error);
                    errorMessage.textContent = 'Email atau password salah.';
                });
        });
    }
}

function initCommonElements(user) {
    // ... (Logika Sidebar & Logout tidak berubah) ...
}

function initDashboardPage() {
    console.log("Dashboard: Inisialisasi halaman...");
    const totalPesertaEl = document.getElementById('total-peserta-card');
    const danaTerkumpulEl = document.getElementById('dana-terkumpul-card');
    const tanggalKocokanEl = document.getElementById('tanggal-kocokan-card');
    const pemenangTerakhirEl = document.getElementById('pemenang-terakhir-card');

    const loadDashboardData = async () => {
        console.log("Dashboard: Memuat data...");
        try {
            // Mengambil semua data peserta dan pengaturan
            const pengaturanRef = doc(db, "pengaturan", "umum");
            const [pengaturanSnap, pesertaSnap] = await Promise.all([
                getDoc(pengaturanRef),
                getDocs(collection(db, "peserta"))
            ]);
            console.log("Dashboard: Data berhasil diambil dari Firestore.");

            // Menentukan nilai pengaturan (dari DB atau default)
            let pengaturan = { biaya_per_peserta: 100000, tanggal_kocokan: new Date().toISOString().split('T')[0] };
            if (pengaturanSnap.exists()) {
                pengaturan = pengaturanSnap.data();
            }

            const semuaPeserta = pesertaSnap.docs.map(doc => doc.data());
            const pesertaAktif = semuaPeserta.filter(p => p.aktif === true);
            const pesertaLunas = pesertaAktif.filter(p => p.status_bayar === true);
            const pemenang = semuaPeserta.find(p => p.status_menang === true);

            // Update UI
            totalPesertaEl.textContent = `${pesertaAktif.length} Orang`;
            const totalDana = pesertaLunas.length * pengaturan.biaya_per_peserta;
            danaTerkumpulEl.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDana);
            const tanggal = new Date(pengaturan.tanggal_kocokan + 'T00:00:00');
            tanggalKocokanEl.textContent = tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            pemenangTerakhirEl.textContent = pemenang ? pemenang.nama : "Belum ada pemenang";
            console.log("Dashboard: UI berhasil diperbarui.");

        } catch (error) {
            console.error("Dashboard: Gagal memuat data:", error);
            totalPesertaEl.textContent = 'Error';
            danaTerkumpulEl.textContent = 'Error';
            tanggalKocokanEl.textContent = 'Error';
            pemenangTerakhirEl.textContent = 'Error';
        }
    };
    loadDashboardData();
    // ... (Logika untuk fitur kocokan akan ditambahkan kembali setelah ini stabil)
}

function initPesertaPage() {
    console.log("Peserta: Inisialisasi halaman...");
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

    const showModal = (target) => { if(target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); }};
    const hideModal = (target) => { if(target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); }};
    
    document.getElementById('add-peserta-btn').addEventListener('click', () => {
        form.reset();
        idInput.value = '';
        document.getElementById('modal-title').textContent = 'Tambah Peserta Baru';
        showModal(modal);
    });
    document.getElementById('cancel-btn').addEventListener('click', () => hideModal(modal));
    document.getElementById('cancel-delete-btn').addEventListener('click', () => hideModal(deleteModal));

    // KEMBALI KE METODE STABIL: SIMPAN DULU, BARU MUAT ULANG
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idInput.value;
        const dataToSave = {
            nama: nameInput.value,
            status_bayar: bayarToggle.checked,
            status_menang: menangToggle.checked,
        };
        console.log(`Peserta: Menyimpan data untuk ID: ${id || 'Baru'}`, dataToSave);
        
        try {
            if (id) {
                // Saat edit, jangan ubah status 'aktif' atau field lain yang tidak ada di form
                await updateDoc(doc(db, 'peserta', id), dataToSave);
                showToast('Data berhasil diperbarui!');
            } else {
                // Saat tambah, sertakan nilai default
                await addDoc(collection(db, 'peserta'), { ...dataToSave, aktif: true });
                showToast('Peserta baru ditambahkan!');
            }
            hideModal(modal);
            loadPeserta(); // Muat ulang data setelah sukses
        } catch (error) { 
            console.error("Peserta: Gagal menyimpan data:", error);
            showToast('Terjadi kesalahan saat menyimpan.', false); 
        }
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!docIdToDelete) return;
        console.log(`Peserta: Menghapus dokumen dengan ID: ${docIdToDelete}`);
        try {
            await deleteDoc(doc(db, 'peserta', docIdToDelete));
            showToast('Peserta berhasil dihapus!');
            hideModal(deleteModal);
            loadPeserta(); // Muat ulang data setelah sukses
        } catch (error) { 
            console.error("Peserta: Gagal menghapus data:", error);
            showToast('Gagal menghapus.', false);
        }
    });

    const loadPeserta = async () => {
        console.log("Peserta: Memuat data peserta...");
        if (!listBody) return;
        listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Memuat...</td></tr>`;
        
        try {
            const snap = await getDocs(collection(db, "peserta"));
            console.log(`Peserta: Ditemukan ${snap.size} dokumen.`);
            listBody.innerHTML = '';
            totalText.textContent = `Total ${snap.size} anggota aktif.`;
            if (snap.empty) {
                listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
                return;
            }

            let counter = 1;
            snap.forEach(d => {
                const data = d.data();
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-4 text-slate-500 text-center">${counter}</td>
                    <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${data.status_menang ? 'Sudah' : 'Belum'}</span></td>
                    <td class="p-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button>
                            <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button>
                        </div>
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
                counter++;
            });
            lucide.createIcons();
            console.log("Peserta: Render tabel selesai.");
        } catch (error) {
            console.error("Peserta: Gagal memuat data:", error);
            listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        }
    };
    loadPeserta();
}

function initPengaturanPage() {
    console.log("Pengaturan: Inisialisasi halaman...");
    // ... (Logika halaman pengaturan tidak berubah, sudah stabil)
}