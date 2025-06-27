// ... (Import & Konfigurasi Firebase tidak berubah) ...

// --- LOGIKA UTAMA & ROUTING (DIPERBAIKI) ---
onAuthStateChanged(auth, (user) => {
    const protectedPages = ['dashboard.html', 'peserta.html', 'pengaturan.html'];
    if (user) {
        if (currentPage === 'index.html' || currentPage === '') { window.location.href = 'dashboard.html'; return; }
        // Panggil initCommonElements di setiap halaman yang dilindungi
        initCommonElements(user);
        if (currentPage === 'dashboard.html') initDashboardPage();
        if (currentPage === 'peserta.html') initPesertaPage();
        // INI BAGIAN YANG DIPERBAIKI: Panggil initPengaturanPage
        if (currentPage === 'pengaturan.html') initPengaturanPage();
    } else {
        if (protectedPages.includes(currentPage)) { window.location.href = 'index.html'; return; }
        if (currentPage === 'index.html' || currentPage === '') initLoginPage();
    }
});

// ... (initLoginPage & initCommonElements tidak berubah) ...

// --- INISIALISASI HALAMAN DASHBOARD (DIPERBARUI) ---
function initDashboardPage() {
    console.log("Initializing Dashboard Page...");
    
    const kocokanBtn = document.getElementById('kocokan-btn');
    const kocokanWarningEl = document.getElementById('kocokan-warning-message');
    // ... (elemen lain tidak berubah) ...

    const setKocokanButtonState = (state, message = '') => {
        const defaultIcon = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
        const loadingIcon = '<i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i><span>Memproses...</span>';

        kocokanBtn.disabled = (state === 'disabled' || state === 'loading');
        
        if (state === 'loading') {
            kocokanBtn.innerHTML = loadingIcon;
        } else {
            kocokanBtn.innerHTML = defaultIcon;
        }

        if (message) {
            kocokanWarningEl.textContent = message;
            kocokanWarningEl.classList.remove('hidden');
        } else {
            kocokanWarningEl.classList.add('hidden');
        }
        lucide.createIcons();
    };

    const handleKocokan = async () => {
        setKocokanButtonState('loading', 'Memeriksa jadwal...');
        // ... (sisa logika handleKocokan tidak berubah) ...
    };

    // ... (Fungsi proceedWithDraw tidak berubah) ...

    const loadDashboardData = async () => {
        try {
            const [pengaturan, pesertaSnap] = await Promise.all([
                getPengaturan(),
                getDocs(query(collection(db, "peserta"), where("aktif", "==", true)))
            ]);

            // ... (logika update kartu statistik tidak berubah) ...
            
            // LOGIKA BARU: Cek peserta yang belum bayar
            const belumBayarCount = pesertaSnap.docs.filter(doc => doc.data().status_bayar === false).length;
            
            if (belumBayarCount > 0) {
                const message = `Ada ${belumBayarCount} peserta belum membayar iuran.`;
                setKocokanButtonState('disabled', message);
            } else {
                setKocokanButtonState('enabled');
            }

        } catch (error) {
            console.error("Gagal memuat data dashboard:", error);
            setKocokanButtonState('disabled', 'Gagal memuat data.');
            // ... (logika menampilkan error di kartu) ...
        }
    };

    if(kocokanBtn) kocokanBtn.addEventListener('click', handleKocokan);
    loadDashboardData();
}

// ... (initPesertaPage & initPengaturanPage tidak berubah) ...