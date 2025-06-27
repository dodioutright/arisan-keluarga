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
    const totalPesertaEl = document.getElementById('total-peserta-card');
    const danaTerkumpulEl = document.getElementById('dana-terkumpul-card');
    const tanggalKocokanEl = document.getElementById('tanggal-kocokan-card');
    const pemenangTerakhirEl = document.getElementById('pemenang-terakhir-card');
    const kocokanBtn = document.getElementById('kocokan-btn');
    const kocokanWarningEl = document.getElementById('kocokan-warning-message');
    const confirmModal = document.getElementById('confirm-kocokan-modal');
    const kocokanModal = document.getElementById('kocokan-modal');
    const animasiDiv = document.getElementById('animasi-kocokan');
    const pemenangDiv = document.getElementById('pemenang-container');
    const namaAnimasiEl = document.getElementById('nama-animasi-display');
    const namaPemenangEl = document.getElementById('nama-pemenang');
    const tutupModalBtn = document.getElementById('tutup-modal-pemenang');

    const showModal = (target) => { if(target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); } };
    const hideModal = (target) => { if(target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); } };

    if(tutupModalBtn) tutupModalBtn.addEventListener('click', () => hideModal(kocokanModal));

    const setKocokanButtonState = (state, message = '') => {
        if (!kocokanBtn) return;
        const defaultIcon = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
        const loadingIcon = '<i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i><span>Memproses...</span>';

        kocokanBtn.disabled = (state === 'disabled' || state === 'loading');
        
        if (state === 'loading') {
            kocokanBtn.innerHTML = loadingIcon;
        } else {
            kocokanBtn.innerHTML = defaultIcon;
        }

        if (kocokanWarningEl) {
            kocokanWarningEl.textContent = message;
            kocokanWarningEl.classList.toggle('hidden', !message);
        }
        lucide.createIcons();
    };

    const getPengaturan = async () => {
        const pengaturanRef = doc(db, "pengaturan", "umum");
        const docSnap = await getDoc(pengaturanRef);
        if (docSnap.exists()) return docSnap.data();
        
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const year = nextMonth.getFullYear();
        const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
        const day = String(nextMonth.getDate()).padStart(2, '0');
        return { biaya_per_peserta: 100000, tanggal_kocokan: `${year}-${month}-${day}` };
    };

    const getPemenangTerakhir = async () => {
        // Workaround tanpa index: Ambil semua lalu filter di client
        const semuaPesertaSnap = await getDocs(collection(db, "peserta"));
        const pemenangDoc = semuaPesertaSnap.docs.find(doc => doc.data().status_menang === true);
        return pemenangDoc ? pemenangDoc.data().nama : "Belum ada pemenang";
    };

    const proceedWithDraw = async () => {
        setKocokanButtonState('loading', 'Mengambil data peserta...');
        try {
            // Workaround tanpa index: Ambil semua lalu filter di client
            const semuaPesertaSnap = await getDocs(collection(db, "peserta"));
            const eligiblePeserta = [];
            semuaPesertaSnap.forEach(doc => {
                const data = doc.data();
                if (data.aktif && data.status_bayar && !data.status_menang) {
                    eligiblePeserta.push({ id: doc.id, ...data });
                }
            });

            if (eligiblePeserta.length === 0) {
                showToast("Tidak ada peserta yang memenuhi syarat.", false);
                setKocokanButtonState('enabled');
                return;
            }

            pemenangDiv.classList.add('hidden');
            animasiDiv.classList.remove('hidden');
            showModal(kocokanModal);

            let animationInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * eligiblePeserta.length);
                namaAnimasiEl.textContent = eligiblePeserta[randomIndex].nama;
            }, 75);

            setTimeout(() => { clearInterval(animationInterval); animationInterval = setInterval(() => { const i = Math.floor(Math.random() * eligiblePeserta.length); namaAnimasiEl.textContent = eligiblePeserta[i].nama; }, 150); }, 2000);
            setTimeout(() => { clearInterval(animationInterval); animationInterval = setInterval(() => { const i = Math.floor(Math.random() * eligiblePeserta.length); namaAnimasiEl.textContent = eligiblePeserta[i].nama; }, 400); }, 3500);

            setTimeout(async () => {
                clearInterval(animationInterval);
                const pemenang = eligiblePeserta[Math.floor(Math.random() * eligiblePeserta.length)];
                await updateDoc(doc(db, 'peserta', pemenang.id), { status_menang: true });
                localStorage.removeItem('pesertaCache');

                namaAnimasiEl.textContent = pemenang.nama;
                namaPemenangEl.textContent = pemenang.nama;
                
                setTimeout(() => {
                    animasiDiv.classList.add('hidden');
                    pemenangDiv.classList.remove('hidden');
                    lucide.createIcons();
                    if(window.confetti) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                }, 500);
                
                loadDashboardData();
            }, 4500);

        } catch (error) {
            console.error("Error saat proses kocokan:", error);
            showToast("Gagal melakukan proses kocokan.", false);
            setKocokanButtonState('enabled');
        }
    };
    
    const handleKocokan = async () => {
        setKocokanButtonState('loading', 'Memeriksa jadwal...');
        try {
            const pengaturan = await getPengaturan();
            const tanggalKocokan = new Date(pengaturan.tanggal_kocokan + 'T00:00:00');
            const hariIni = new Date();
            hariIni.setHours(0, 0, 0, 0);

            if (hariIni < tanggalKocokan) {
                showModal(confirmModal);
                document.getElementById('cancel-kocokan-btn').onclick = () => {
                    hideModal(confirmModal);
                    setKocokanButtonState('enabled');
                };
                document.getElementById('proceed-kocokan-btn').onclick = () => {
                    hideModal(confirmModal);
                    proceedWithDraw();
                };
            } else {
                proceedWithDraw();
            }
        } catch (error) {
            console.error("Error memeriksa jadwal kocokan:", error);
            showToast("Gagal memeriksa jadwal.", false);
            setKocokanButtonState('enabled');
        }
    };
    
    if(kocokanBtn) kocokanBtn.addEventListener('click', handleKocokan);

    const loadDashboardData = async () => {
        try {
            const [pengaturan, semuaPesertaSnap, pemenangTerakhir] = await Promise.all([
                getPengaturan(),
                getDocs(collection(db, "peserta")),
                getPemenangTerakhir()
            ]);
            
            const pesertaAktifDocs = semuaPesertaSnap.docs.filter(doc => doc.data().aktif === true);

            totalPesertaEl.textContent = `${pesertaAktifDocs.length} Orang`;
            const pesertaLunas = pesertaAktifDocs.filter(doc => doc.data().status_bayar === true).length;
            const totalDana = pesertaLunas * pengaturan.biaya_per_peserta;
            danaTerkumpulEl.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDana);
            
            const tanggal = new Date(pengaturan.tanggal_kocokan + 'T00:00:00'); 
            tanggalKocokanEl.textContent = tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            
            pemenangTerakhirEl.textContent = pemenangTerakhir;
            
            const belumBayarCount = pesertaAktifDocs.length - pesertaLunas;
            if (belumBayarCount > 0) {
                setKocokanButtonState('disabled', `Ada ${belumBayarCount} peserta belum membayar iuran.`);
            } else {
                setKocokanButtonState('enabled');
            }

        } catch (error) {
            console.error("Gagal memuat data dashboard:", error);
            totalPesertaEl.textContent = 'Error';
            danaTerkumpulEl.textContent = 'Error';
            tanggalKocokanEl.textContent = 'Error';
            pemenangTerakhirEl.textContent = 'Error';
            setKocokanButtonState('disabled', 'Gagal memuat data.');
        }
    };
    loadDashboardData();
}

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
    let localPesertaState = [];

    const showModal = (target) => { if(target){ target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); }};
    const hideModal = (target) => { if(target){ target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); }};
    
    document.getElementById('add-peserta-btn')?.addEventListener('click', () => {
        form.reset();
        idInput.value = '';
        document.getElementById('modal-title').textContent = 'Tambah Peserta Baru';
        showModal(modal);
    });
    document.getElementById('cancel-btn')?.addEventListener('click', () => hideModal(modal));
    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => hideModal(deleteModal));
    
    const invalidateCacheAndReload = () => {
        localStorage.removeItem('pesertaCache');
        if (skeletonBody) skeletonBody.classList.remove('hidden');
        if (listBody) listBody.classList.add('hidden');
        loadPeserta();
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idInput.value;
        const optimisticData = {
            id: id || `temp-${Date.now()}`,
            nama: nameInput.value,
            status_bayar: bayarToggle.checked,
            status_menang: menangToggle.checked,
            aktif: true
        };

        const originalState = [...localPesertaState];
        hideModal(modal);

        if (id) {
            localPesertaState = localPesertaState.map(p => p.id === id ? optimisticData : p);
        } else {
            localPesertaState.push(optimisticData);
        }
        renderPesertaTable(localPesertaState);
        
        try {
            const dataToSave = { nama: optimisticData.nama, status_bayar: optimisticData.status_bayar, status_menang: optimisticData.status_menang };
            if (id) {
                await updateDoc(doc(db, 'peserta', id), dataToSave);
            } else {
                dataToSave.aktif = true;
                await addDoc(collection(db, 'peserta'), dataToSave);
            }
            showToast(id ? 'Data berhasil diperbarui!' : 'Peserta baru ditambahkan!');
            invalidateCacheAndReload();
        } catch (error) {
            console.error("Gagal menyimpan data:", error);
            showToast('Gagal menyimpan ke server.', false);
            renderPesertaTable(originalState);
        }
    });

    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
        if (!docIdToDelete) return;
        const originalState = [...localPesertaState];
        const idToDelete = docIdToDelete;
        hideModal(deleteModal);
        localPesertaState = localPesertaState.filter(p => p.id !== idToDelete);
        renderPesertaTable(localPesertaState);
        try {
            await deleteDoc(doc(db, 'peserta', idToDelete));
            showToast('Peserta berhasil dihapus!');
            invalidateCacheAndReload();
        } catch (error) {
            showToast('Gagal menghapus dari server.', false);
            renderPesertaTable(originalState);
        }
    });
    
    const renderPesertaTable = (pesertaArray) => {
        if (!listBody) return;
        listBody.innerHTML = '';
        if (pesertaArray.length === 0) {
            listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
        } else {
            let counter = 1;
            pesertaArray.forEach(peserta => {
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-4 text-slate-500 text-center">${counter++}</td>
                    <td class="p-4 font-medium text-slate-800">${peserta.nama}</td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${peserta.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${peserta.status_menang ? 'Sudah' : 'Belum'}</span></td>
                    <td class="p-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button>
                            <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button>
                        </div>
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
        if(skeletonBody) skeletonBody.classList.add('hidden');
        listBody.classList.remove('hidden');
        lucide.createIcons();
    };

    const loadPeserta = async () => {
        const cachedDataString = localStorage.getItem('pesertaCache');
        if (cachedDataString) {
            localPesertaState = JSON.parse(cachedDataString);
            totalText.textContent = `Total ${localPesertaState.length} anggota aktif.`;
            renderPesertaTable(localPesertaState);
        } else {
            if(skeletonBody) skeletonBody.classList.remove('hidden');
        }

        try {
            const snap = await getDocs(collection(db, "peserta"));
            const freshData = [];
            snap.forEach(d => freshData.push({ id: d.id, ...d.data() }));
            localPesertaState = freshData;
            
            totalText.textContent = `Total ${localPesertaState.length} anggota aktif.`;
            renderPesertaTable(localPesertaState);
            localStorage.setItem('pesertaCache', JSON.stringify(freshData));
        } catch (error) {
            console.error("Error memuat peserta:", error);
            if (!cachedDataString) listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        }
    };
    loadPeserta();
}

function initPengaturanPage() {
    const form = document.getElementById('pengaturan-form');
    const biayaInput = document.getElementById('biaya_per_peserta');
    const tanggalInput = document.getElementById('tanggal_kocokan');
    const simpanBtn = document.getElementById('simpan-btn');
    const pengaturanRef = doc(db, "pengaturan", "umum");

    const loadPengaturan = async () => {
        try {
            const docSnap = await getDoc(pengaturanRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                biayaInput.value = data.biaya_per_peserta;
                tanggalInput.value = data.tanggal_kocokan;
            } else {
                biayaInput.value = 100000;
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const year = nextMonth.getFullYear();
                const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
                const day = String(nextMonth.getDate()).padStart(2, '0');
                tanggalInput.value = `${year}-${month}-${day}`;
            }
        } catch (error) { showToast("Gagal memuat pengaturan.", false); }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        simpanBtn.disabled = true;
        simpanBtn.textContent = 'Menyimpan...';
        const dataToSave = {
            biaya_per_peserta: parseInt(biayaInput.value, 10),
            tanggal_kocokan: tanggalInput.value,
        };
        try {
            await setDoc(pengaturanRef, dataToSave);
            showToast("Pengaturan berhasil disimpan!");
        } catch (error) {
            showToast("Gagal menyimpan pengaturan.", false);
        } finally {
            simpanBtn.disabled = false;
            simpanBtn.innerHTML = '<i data-lucide="save" class="h-4 w-4"></i><span>Simpan Pengaturan</span>';
            lucide.createIcons();
        }
    });
    loadPengaturan();
}