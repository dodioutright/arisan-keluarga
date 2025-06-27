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

    const showModal = (target) => { if(target) { target.classList.remove('opacity-0', 'pointer-events-none'); target.querySelector('.modal-content').classList.remove('scale-95'); } };
    const hideModal = (target) => { if(target) { target.classList.add('opacity-0'); target.querySelector('.modal-content').classList.add('scale-95'); setTimeout(() => target.classList.add('pointer-events-none'), 300); } };

    const setKocokanButtonState = (state, message = '') => {
        if (!kocokanBtn) return;
        const defaultIcon = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
        const loadingIcon = '<i data-lucide="loader-circle" class="h-5 w-5 animate-spin"></i><span>Memproses...</span>';
        kocokanBtn.disabled = (state === 'disabled' || state === 'loading');
        kocokanBtn.innerHTML = (state === 'loading') ? loadingIcon : defaultIcon;
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
        return { biaya_per_peserta: 100000, tanggal_kocokan: nextMonth.toISOString().split('T')[0] };
    };
    
    const getPemenangTerakhir = async (allPesertaDocs) => {
        const pemenangDoc = allPesertaDocs.find(doc => doc.data().status_menang === true);
        return pemenangDoc ? pemenangDoc.data().nama : "Belum ada pemenang";
    };

    const loadDashboardData = async () => {
        try {
            const [pengaturan, semuaPesertaSnap] = await Promise.all([
                getPengaturan(),
                getDocs(collection(db, "peserta"))
            ]);
            
            const pemenangTerakhir = await getPemenangTerakhir(semuaPesertaSnap.docs);
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

    const proceedWithDraw = async () => { /* ... (Fungsi tidak berubah) ... */ };
    const handleKocokan = async () => { /* ... (Fungsi tidak berubah) ... */ };
    if (kocokanBtn) kocokanBtn.addEventListener('click', handleKocokan);
    
    loadDashboardData();
}

function initPesertaPage() {
    // ... (Logika lengkap untuk halaman peserta tidak berubah)
}

function initPengaturanPage() {
    // ... (Logika lengkap untuk halaman pengaturan tidak berubah)
}