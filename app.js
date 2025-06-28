import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc, orderBy, limit, writeBatch, deleteField } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
const currentPagePath = window.location.pathname.split('/').pop();

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
    const protectedPages = ['dashboard.html', 'peserta.html', 'pengaturan.html', 'riwayat.html'];
    if (user) {
        if (currentPagePath === 'index.html' || currentPagePath === '') {
            window.location.href = 'dashboard.html';
            return;
        }
        initCommonElements(user);
        if (currentPagePath === 'dashboard.html') initDashboardPage();
        if (currentPagePath === 'peserta.html') initPesertaPage();
        if (currentPagePath === 'riwayat.html') initRiwayatPage();
        if (currentPagePath === 'pengaturan.html') initPengaturanPage();

    } else {
        if (protectedPages.includes(currentPagePath)) {
            window.location.href = 'index.html';
            return;
        }
        if (currentPagePath === 'index.html' || currentPagePath === '') initLoginPage();
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

    const openSidebar = () => {
        if (mobileSidebar) {
            document.body.style.overflow = 'hidden';
            mobileSidebar.classList.remove('opacity-0', 'pointer-events-none');
            sidebarContent.classList.remove('translate-x-full');
        }
    };
    const closeSidebar = () => {
        if (mobileSidebar) {
            document.body.style.overflow = '';
            sidebarContent.classList.add('translate-x-full');
            mobileSidebar.classList.add('opacity-0');
            setTimeout(() => mobileSidebar.classList.add('pointer-events-none'), 300);
        }
    };
    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', closeSidebar);
    if (mobileSidebar) mobileSidebar.addEventListener('click', (e) => {
        if (e.target === mobileSidebar) closeSidebar();
    });

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
    const judulPemenangEl = document.getElementById('judul-pemenang');
    const daftarPemenangContainer = document.getElementById('daftar-pemenang-container');
    const tutupModalBtn = document.getElementById('tutup-modal-pemenang');

    const showModal = (target) => { if (target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); } };
    const hideModal = (target) => { if (target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); } };

    if (tutupModalBtn) tutupModalBtn.addEventListener('click', () => hideModal(kocokanModal));

    const setKocokanButtonState = (state, message = '') => {
        if (!kocokanBtn) return;
        const defaultIcon = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
        const loadingIcon = '<i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i><span>Memproses...</span>';
        kocokanBtn.disabled = (state === 'disabled' || state === 'loading');
        if (state === 'loading') { kocokanBtn.innerHTML = loadingIcon; } else { kocokanBtn.innerHTML = defaultIcon; }
        if (message) { kocokanWarningEl.textContent = message; kocokanWarningEl.classList.remove('hidden'); } else { kocokanWarningEl.classList.add('hidden'); }
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
        return { biaya_per_peserta: 100000, tanggal_kocokan: `${year}-${month}-${day}`, jumlah_pemenang: 1 };
    };

    const proceedWithDraw = async () => {
        setKocokanButtonState('loading', 'Mempersiapkan kocokan...');
        try {
            const pengaturan = await getPengaturan();
            const jumlahPemenang = pengaturan.jumlah_pemenang || 1;
            const q = query(collection(db, "peserta"), where("aktif", "==", true), where("status_bayar", "==", true), where("status_menang", "==", false));
            const eligibleSnap = await getDocs(q);
            const eligiblePeserta = [];
            eligibleSnap.forEach(doc => eligiblePeserta.push({ id: doc.id, ...doc.data() }));
            if (eligiblePeserta.length < jumlahPemenang) {
                showToast(`Peserta yang memenuhi syarat (${eligiblePeserta.length}) kurang dari jumlah pemenang (${jumlahPemenang}).`, false);
                setKocokanButtonState('enabled');
                return;
            }
            const pemenangTerpilih = [];
            let pool = [...eligiblePeserta];
            for (let i = 0; i < jumlahPemenang; i++) {
                const randomIndex = Math.floor(Math.random() * pool.length);
                pemenangTerpilih.push(pool[randomIndex]);
                pool.splice(randomIndex, 1);
            }
            pemenangDiv.classList.add('hidden');
            animasiDiv.classList.remove('hidden');
            showModal(kocokanModal);
            let animationInterval = setInterval(() => { const i = Math.floor(Math.random() * eligiblePeserta.length); namaAnimasiEl.textContent = eligiblePeserta[i].nama; }, 75);
            setTimeout(() => { clearInterval(animationInterval); animationInterval = setInterval(() => { const i = Math.floor(Math.random() * eligiblePeserta.length); namaAnimasiEl.textContent = eligiblePeserta[i].nama; }, 150); }, 2000);
            setTimeout(() => { clearInterval(animationInterval); animationInterval = setInterval(() => { const i = Math.floor(Math.random() * eligiblePeserta.length); namaAnimasiEl.textContent = eligiblePeserta[i].nama; }, 400); }, 3500);
            setTimeout(async () => {
                clearInterval(animationInterval);
                const batch = writeBatch(db);
                pemenangTerpilih.forEach(pemenang => {
                    const docRef = doc(db, 'peserta', pemenang.id);
                    batch.update(docRef, { status_menang: true, tanggal_menang: new Date() });
                });
                await batch.commit();
                localStorage.removeItem('pesertaCache');
                localStorage.removeItem('dashboardCache');
                if (judulPemenangEl) judulPemenangEl.textContent = `Selamat kepada ${pemenangTerpilih.length} Pemenang!`;
                if (daftarPemenangContainer) {
                    daftarPemenangContainer.innerHTML = '';
                    pemenangTerpilih.forEach(pemenang => {
                        const p = document.createElement('p');
                        p.className = "text-3xl font-extrabold text-green-700 bg-green-50 border-2 border-green-200 rounded-lg p-4";
                        p.textContent = pemenang.nama;
                        daftarPemenangContainer.appendChild(p);
                    });
                }
                setTimeout(() => {
                    animasiDiv.classList.add('hidden');
                    pemenangDiv.classList.remove('hidden');
                    lucide.createIcons();
                    if(window.confetti) confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                }, 500);
                setKocokanButtonState('enabled');
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
                document.getElementById('cancel-kocokan-btn').onclick = () => { hideModal(confirmModal); setKocokanButtonState('enabled'); };
                document.getElementById('proceed-kocokan-btn').onclick = () => { hideModal(confirmModal); proceedWithDraw(); };
            } else { proceedWithDraw(); }
        } catch (error) { console.error("Error memeriksa jadwal kocokan:", error); showToast("Gagal memeriksa jadwal.", false); setKocokanButtonState('enabled'); }
    };
    
    if(kocokanBtn) kocokanBtn.addEventListener('click', handleKocokan);

    const loadDashboardData = async () => {
        setKocokanButtonState('loading', 'Memuat data...');
        const createSkeleton = (title) => `<p class="text-sm text-slate-500">${title}</p><div class="animate-pulse flex-1 space-y-2 py-1 mt-1"><div class="h-6 w-3/4 rounded bg-slate-200"></div></div>`;
        const cachedData = localStorage.getItem('dashboardCache');
        if (cachedData) {
            const data = JSON.parse(cachedData);
            totalPesertaEl.innerHTML = `<p class="text-sm text-slate-500">Total Peserta</p><p class="text-2xl font-bold text-slate-900">${data.totalPesertaText}</p>`;
            danaTerkumpulEl.innerHTML = `<p class="text-sm text-slate-500">Dana Terkumpul</p><p class="text-2xl font-bold text-slate-900">${data.totalDanaText}</p>`;
            tanggalKocokanEl.innerHTML = `<p class="text-sm text-slate-500">Kocokan Berikutnya</p><p class="text-2xl font-bold text-slate-900">${data.tanggalKocokanText}</p>`;
            pemenangTerakhirEl.innerHTML = `<p class="text-sm text-slate-500">Pemenang Terakhir</p><p class="text-2xl font-bold text-slate-900">${data.pemenangTerakhirText}</p>`;
        } else {
            totalPesertaEl.innerHTML = createSkeleton('Total Peserta');
            danaTerkumpulEl.innerHTML = createSkeleton('Dana Terkumpul');
            tanggalKocokanEl.innerHTML = createSkeleton('Kocokan Berikutnya');
            pemenangTerakhirEl.innerHTML = createSkeleton('Pemenang Terakhir');
        }

        try {
            const [pengaturan, pesertaSnap] = await Promise.all([ getPengaturan(), getDocs(query(collection(db, "peserta"), where("aktif", "==", true))) ]);
            const totalPesertaText = `${pesertaSnap.size} Orang`;
            const pesertaLunas = pesertaSnap.docs.filter(doc => doc.data().status_bayar === true).length;
            const totalDana = pesertaLunas * (pengaturan.biaya_per_peserta || 0);
            const totalDanaText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalDana);
            const tanggal = new Date(pengaturan.tanggal_kocokan + 'T00:00:00');
            const tanggalKocokanText = tanggal.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            
            const pemenangQuery = query(collection(db, "peserta"), where("status_menang", "==", true), orderBy("tanggal_menang", "desc"), limit(1));
            const pemenangSnap = await getDocs(pemenangQuery);
            const pemenangTerakhirText = pemenangSnap.empty ? '-' : pemenangSnap.docs[0].data().nama;

            totalPesertaEl.innerHTML = `<p class="text-sm text-slate-500">Total Peserta</p><p class="text-2xl font-bold text-slate-900">${totalPesertaText}</p>`;
            danaTerkumpulEl.innerHTML = `<p class="text-sm text-slate-500">Dana Terkumpul</p><p class="text-2xl font-bold text-slate-900">${totalDanaText}</p>`;
            tanggalKocokanEl.innerHTML = `<p class="text-sm text-slate-500">Kocokan Berikutnya</p><p class="text-2xl font-bold text-slate-900">${tanggalKocokanText}</p>`;
            pemenangTerakhirEl.innerHTML = `<p class="text-sm text-slate-500">Pemenang Terakhir</p><p class="text-2xl font-bold text-slate-900">${pemenangTerakhirText}</p>`;
            
            const dataToCache = { totalPesertaText, totalDanaText, tanggalKocokanText, pemenangTerakhirText };
            localStorage.setItem('dashboardCache', JSON.stringify(dataToCache));

            const belumBayarCount = pesertaSnap.size - pesertaLunas;
            if (belumBayarCount > 0) { setKocokanButtonState('disabled', `Ada ${belumBayarCount} peserta belum membayar iuran.`); } else { setKocokanButtonState('enabled'); }

        } catch (error) {
            console.error("Gagal memuat data dashboard:", error);
            const errorHtml = `<p class="text-sm text-red-500">Gagal Memuat</p>`;
            totalPesertaEl.innerHTML = `<p class="text-sm text-slate-500">Total Peserta</p>${errorHtml}`;
            danaTerkumpulEl.innerHTML = `<p class="text-sm text-slate-500">Dana Terkumpul</p>${errorHtml}`;
            tanggalKocokanEl.innerHTML = `<p class="text-sm text-slate-500">Kocokan Berikutnya</p>${errorHtml}`;
            pemenangTerakhirEl.innerHTML = `<p class="text-sm text-slate-500">Pemenang Terakhir</p>${errorHtml}`;
            setKocokanButtonState('disabled', 'Gagal memuat data.');
        }
    };
    loadDashboardData();
}

function initPesertaPage() {
    const mainElement = document.querySelector('main');
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
    const paginationControls = document.getElementById('pagination-controls');
    const searchInput = document.getElementById('search-input');
    const filterSelect = document.getElementById('filter-select');
    const resetBtn = document.getElementById('reset-filter-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');

    let docIdToDelete = null;
    let localPesertaState = [];
    let filteredPesertaState = [];
    let currentPage = 1;
    const itemsPerPage = 10;

    const showModal = (target) => { if (target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); } };
    const hideModal = (target) => { if (target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); } };
    
    const updateMenangToggleState = () => {
        const helperText = document.getElementById('menang-helper-text');
        menangToggle.disabled = !bayarToggle.checked;
        if (!bayarToggle.checked) {
            menangToggle.checked = false;
        }
        if(helperText){
            if (menangToggle.disabled) {
                helperText.classList.remove('hidden');
            } else {
                helperText.classList.add('hidden');
            }
        }
    };

    document.getElementById('add-peserta-btn')?.addEventListener('click', () => { 
        form.reset(); 
        idInput.value = ''; 
        document.getElementById('modal-title').textContent = 'Tambah Peserta Baru'; 
        updateMenangToggleState();
        showModal(modal); 
    });
    document.getElementById('cancel-btn')?.addEventListener('click', () => hideModal(modal));
    document.getElementById('cancel-delete-btn')?.addEventListener('click', () => hideModal(deleteModal));

    const invalidateCacheAndReload = () => { 
        localStorage.removeItem('pesertaCache'); 
        localStorage.removeItem('dashboardCache'); 
        loadPeserta(); 
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('button[type="submit"]');
        const nama = nameInput.value.trim();
        if (nama === '') {
            showToast('Nama peserta tidak boleh kosong.', false);
            return;
        }
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i><span>Menyimpan...</span>';
        lucide.createIcons();
        const id = idInput.value;
        try {
            const dataToSave = { nama: nama, status_bayar: bayarToggle.checked, status_menang: menangToggle.checked };
            if (id) { 
                await updateDoc(doc(db, 'peserta', id), dataToSave); 
            } else { 
                dataToSave.aktif = true; 
                await addDoc(collection(db, 'peserta'), dataToSave); 
            }
            hideModal(modal);
            showToast(id ? 'Data berhasil diperbarui!' : 'Peserta baru ditambahkan!');
            invalidateCacheAndReload();
        } catch (error) { 
            showToast('Gagal menyimpan ke server.', false); 
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Simpan';
        }
    });

    document.getElementById('confirm-delete-btn')?.addEventListener('click', async () => {
        if (!docIdToDelete) return;
        hideModal(deleteModal);
        try { await deleteDoc(doc(db, 'peserta', docIdToDelete)); showToast('Peserta berhasil dihapus!'); invalidateCacheAndReload(); } 
        catch (error) { showToast('Gagal menghapus dari server.', false); }
    });
    
    exportPdfBtn?.addEventListener('click', () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const tableHead = [['No', 'Nama Peserta', 'Status Bayar', 'Status Menang']];
        const tableBody = filteredPesertaState.map((peserta, index) => [
            index + 1,
            peserta.nama,
            peserta.status_bayar ? 'Lunas' : 'Belum Bayar',
            peserta.status_menang ? 'Ya' : 'Belum'
        ]);
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        doc.setFontSize(18);
        doc.text('Laporan Arisan Keluarga', pageWidth / 2, 22, { align: 'center' });
        doc.setLineWidth(0.5);
        doc.line(14, 25, pageWidth - 14, 25);
        doc.autoTable({
            head: tableHead,
            body: tableBody,
            startY: 35,
            theme: 'grid',
            headStyles: { fillColor: [41, 51, 61] },
            columnStyles: { 0: { halign: 'center' } },
            didParseCell: function(data) {
                if (data.section === 'head' && data.column.index === 0) {
                    data.cell.styles.halign = 'center';
                }
            },
            didDrawPage: function(data) {
                doc.setFontSize(10);
                doc.setTextColor(150);
                const footerText1 = '© 2025 Arisan Keluarga. All Rights Reserved.';
                doc.text(footerText1, pageWidth / 2, pageHeight - 15, { align: 'center' });
                const footerText2 = 'Made with ❤️ by Dodi Outright.';
                doc.text(footerText2, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        });
        const pdfOutput = doc.output('blob');
        const pdfFile = new File([pdfOutput], 'Laporan Arisan Keluarga.pdf', { type: 'application/pdf' });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
            navigator.share({
                title: 'Laporan Arisan Keluarga',
                text: 'Berikut adalah laporan peserta Arisan Keluarga.',
                files: [pdfFile]
            }).catch(err => {
                if (err.name !== 'AbortError') {
                    console.error('Gagal membagikan:', err);
                    doc.save('Laporan Arisan Keluarga.pdf');
                }
            });
        } else {
            doc.save('Laporan Arisan Keluarga.pdf');
        }
    });

    const applyFiltersAndRender = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        filteredPesertaState = localPesertaState.filter(peserta => {
            const matchesSearch = peserta.nama.toLowerCase().includes(searchTerm);
            let matchesFilter = true;
            switch(filterValue) {
                case 'lunas': matchesFilter = peserta.status_bayar === true; break;
                case 'belum-lunas': matchesFilter = peserta.status_bayar === false; break;
                case 'sudah-menang': matchesFilter = peserta.status_menang === true; break;
                case 'belum-menang': matchesFilter = peserta.status_menang === false; break;
            }
            return matchesSearch && matchesFilter;
        });
        totalText.textContent = `Menampilkan ${filteredPesertaState.length} dari ${localPesertaState.length} peserta.`;
        currentPage = 1;
        renderPesertaTable();
        setupPagination();
    };

    const setupPagination = () => {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        const pageCount = Math.ceil(filteredPesertaState.length / itemsPerPage);
        if (pageCount <= 1) return;
        const createButton = (text, page, isDisabled = false, isActive = false) => {
            const button = document.createElement('button');
            button.className = `inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 mx-0.5 ${isActive ? 'border border-slate-300 bg-slate-900 text-white' : 'hover:bg-slate-100'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`;
            button.innerHTML = text;
            button.disabled = isDisabled;
            button.addEventListener('click', () => { currentPage = page; renderPesertaTable(); setupPagination(); });
            return button;
        };
        paginationControls.appendChild(createButton('<i class="h-4 w-4" data-lucide="chevron-left"></i>', currentPage - 1, currentPage === 1));
        for (let i = 1; i <= pageCount; i++) { paginationControls.appendChild(createButton(i.toString(), i, false, currentPage === i)); }
        paginationControls.appendChild(createButton('<i class="h-4 w-4" data-lucide="chevron-right"></i>', currentPage + 1, currentPage === pageCount));
        lucide.createIcons();
    };

    const renderPesertaTable = () => {
        if (!listBody) return;
        listBody.innerHTML = '';
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filteredPesertaState.slice(startIndex, endIndex);
        if (paginatedItems.length === 0) {
            listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Tidak ada peserta yang cocok dengan kriteria.</td></tr>`;
        } else {
            paginatedItems.forEach((peserta, index) => {
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                tr.innerHTML = `
                    <td class="p-4 text-slate-500 text-center">${startIndex + index + 1}</td>
                    <td class="p-4 font-medium text-slate-800">${peserta.nama}</td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${peserta.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                    <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${peserta.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${peserta.status_menang ? 'Sudah' : 'Belum'}</span></td>
                    <td class="p-4 text-right"> <div class="flex items-center justify-end gap-2"> <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button> <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button> </div> </td>
                `;
                tr.querySelector('.edit-btn').addEventListener('click', () => {
                    idInput.value = peserta.id; nameInput.value = peserta.nama; bayarToggle.checked = peserta.status_bayar; menangToggle.checked = peserta.status_menang;
                    document.getElementById('modal-title').textContent = 'Ubah Data Peserta';
                    updateMenangToggleState();
                    showModal(modal);
                });
                tr.querySelector('.delete-btn').addEventListener('click', () => {
                    docIdToDelete = peserta.id; const namePlaceholder = document.getElementById('peserta-to-delete-name');
                    if (namePlaceholder) { namePlaceholder.textContent = peserta.nama; } showModal(deleteModal);
                });
            });
        }
        skeletonBody.classList.add('hidden');
        listBody.classList.remove('hidden');
        lucide.createIcons();
    };
    
    bayarToggle?.addEventListener('change', updateMenangToggleState);
    searchInput?.addEventListener('input', applyFiltersAndRender);
    filterSelect?.addEventListener('change', applyFiltersAndRender);
    resetBtn?.addEventListener('click', () => { searchInput.value = ''; filterSelect.value = 'all'; applyFiltersAndRender(); });

    const loadPeserta = async () => {
        mainElement?.classList.add('is-loading');
        skeletonBody.classList.remove('hidden');
        listBody.classList.add('hidden');
        paginationControls.innerHTML = '';
        try {
            const snap = await getDocs(query(collection(db, "peserta")));
            localPesertaState = [];
            snap.forEach(d => localPesertaState.push({ id: d.id, ...d.data() }));
            applyFiltersAndRender();
            localStorage.setItem('pesertaCache', JSON.stringify(localPesertaState));
        } catch (error) {
            console.error("Error memuat peserta:", error);
            skeletonBody.classList.add('hidden');
            listBody.classList.remove('hidden');
            listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        } finally {
            mainElement?.classList.remove('is-loading');
        }
    };
    loadPeserta();
}

function initRiwayatPage() {
    const mainElement = document.querySelector('main');
    const listBody = document.getElementById('riwayat-list-body');
    const totalPemenangText = document.getElementById('total-pemenang-text');

    const loadRiwayatData = async () => {
        mainElement?.classList.add('is-loading');
        if (!listBody) return;
        listBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500">Memuat riwayat...</td></tr>`;
        try {
            const q = query(collection(db, "peserta"), where("status_menang", "==", true), orderBy("tanggal_menang", "desc"));
            const querySnapshot = await getDocs(q);
            listBody.innerHTML = '';
            if (querySnapshot.empty) {
                listBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-slate-500">Belum ada pemenang.</td></tr>`;
                if(totalPemenangText) totalPemenangText.textContent = 'Total 0 pemenang.';
                return;
            }
            if(totalPemenangText) totalPemenangText.textContent = `Total ${querySnapshot.size} pemenang tercatat.`;
            let counter = 1;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const tr = listBody.insertRow();
                tr.className = 'hover:bg-slate-50';
                const tanggalMenang = data.tanggal_menang ? data.tanggal_menang.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tidak tercatat';
                tr.innerHTML = `
                    <td class="p-4 text-slate-500 text-center">${counter}</td>
                    <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                    <td class="p-4 text-slate-600">${tanggalMenang}</td>
                `;
                counter++;
            });
        } catch (error) {
            console.error("Error memuat riwayat:", error);
            listBody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-red-500">Gagal memuat riwayat.</td></tr>`;
        } finally {
            mainElement?.classList.remove('is-loading');
        }
    };
    loadRiwayatData();
}

function initPengaturanPage() {
    const mainElement = document.querySelector('main');
    const form = document.getElementById('pengaturan-form');
    const biayaInput = document.getElementById('biaya_per_peserta');
    const tanggalInput = document.getElementById('tanggal_kocokan');
    const jumlahPemenangInput = document.getElementById('jumlah_pemenang');
    const pengaturanRef = doc(db, "pengaturan", "umum");
    const resetBtn = document.getElementById('reset-arisan-btn');
    const resetModal = document.getElementById('reset-confirm-modal');
    const cancelResetBtn = document.getElementById('cancel-reset-btn');
    const confirmResetBtn = document.getElementById('confirm-reset-btn');
    
    const formElements = form ? Array.from(form.querySelectorAll('input, button')) : [];
    const toggleFormState = (disabled) => {
        formElements.forEach(el => el.disabled = disabled);
    };

    const showModal = (target) => { if (target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); } };
    const hideModal = (target) => { if (target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); } };

    const loadPengaturan = async () => {
        mainElement?.classList.add('is-loading');
        toggleFormState(true);
        try {
            const docSnap = await getDoc(pengaturanRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                biayaInput.value = data.biaya_per_peserta;
                tanggalInput.value = data.tanggal_kocokan;
                jumlahPemenangInput.value = data.jumlah_pemenang || 1;
            } else {
                biayaInput.value = 100000;
                jumlahPemenangInput.value = 1;
                const now = new Date();
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                const year = nextMonth.getFullYear();
                const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
                const day = String(nextMonth.getDate()).padStart(2, '0');
                tanggalInput.value = `${year}-${month}-${day}`;
            }
        } catch (error) { 
            showToast("Gagal memuat pengaturan.", false); 
        } finally {
            toggleFormState(false);
            mainElement?.classList.remove('is-loading');
        }
    };

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const simpanBtn = form.querySelector('button[type="submit"]');
        simpanBtn.disabled = true;
        simpanBtn.innerHTML = '<i data-lucide="loader-circle" class="h-4 w-4 animate-spin"></i><span>Menyimpan...</span>';
        lucide.createIcons();
        const dataToSave = {
            biaya_per_peserta: parseInt(biayaInput.value, 10),
            tanggal_kocokan: tanggalInput.value,
            jumlah_pemenang: parseInt(jumlahPemenangInput.value, 10)
        };
        try {
            await setDoc(pengaturanRef, dataToSave);
            localStorage.removeItem('dashboardCache');
            showToast("Pengaturan berhasil disimpan!");
        } catch (error) { 
            showToast("Gagal menyimpan pengaturan.", false); 
        } finally {
            simpanBtn.disabled = false;
            simpanBtn.innerHTML = '<i data-lucide="save" class="h-4 w-4"></i><span>Simpan Pengaturan</span>';
            lucide.createIcons();
        }
    });

    resetBtn?.addEventListener('click', () => showModal(resetModal));
    cancelResetBtn?.addEventListener('click', () => hideModal(resetModal));

    confirmResetBtn?.addEventListener('click', async () => {
        confirmResetBtn.disabled = true;
        confirmResetBtn.textContent = 'Memproses...';
        try {
            const pesertaRef = collection(db, "peserta");
            const snapshot = await getDocs(pesertaRef);
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                const docRef = doc.ref;
                batch.update(docRef, {
                    status_bayar: false,
                    status_menang: false,
                    tanggal_menang: deleteField()
                });
            });
            await batch.commit();
            localStorage.removeItem('pesertaCache');
            localStorage.removeItem('dashboardCache');
            hideModal(resetModal);
            showToast('Siklus arisan berhasil direset!');
        } catch (error) {
            console.error("Error mereset siklus:", error);
            showToast('Gagal mereset siklus.', false);
        } finally {
            confirmResetBtn.disabled = false;
            confirmResetBtn.textContent = 'Ya, Reset Sekarang';
        }
    });

    loadPengaturan();
}