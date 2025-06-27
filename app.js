import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `w-full max-w-xs p-3 rounded-lg text-white ${isSuccess ? 'bg-green-600' : 'bg-red-600'} shadow-lg`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

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
    const kocokanBtn = document.getElementById('kocokan-btn');
    const kocokanModal = document.getElementById('kocokan-modal');
    const animasiDiv = document.getElementById('animasi-kocokan');
    const pemenangDiv = document.getElementById('pemenang-container');
    const namaAnimasiEl = document.getElementById('nama-animasi-display');
    const namaPemenangEl = document.getElementById('nama-pemenang');
    const tutupModalBtn = document.getElementById('tutup-modal-pemenang');

    const showKocokanModal = () => { kocokanModal.classList.remove('opacity-0', 'pointer-events-none'); kocokanModal.querySelector('.modal-content').classList.remove('scale-95'); };
    const hideKocokanModal = () => { kocokanModal.classList.add('opacity-0', 'pointer-events-none'); kocokanModal.querySelector('.modal-content').classList.add('scale-95'); };

    tutupModalBtn.addEventListener('click', hideKocokanModal);

    const handleKocokan = async () => {
        kocokanBtn.disabled = true;
        kocokanBtn.innerHTML = 'Memeriksa peserta...';
        try {
            const q = query(collection(db, "peserta"), where("aktif", "==", true), where("status_bayar", "==", true), where("status_menang", "==", false));
            const eligibleSnap = await getDocs(q);
            const eligiblePeserta = [];
            eligibleSnap.forEach(doc => eligiblePeserta.push({ id: doc.id, ...doc.data() }));

            if (eligiblePeserta.length === 0) {
                showToast("Tidak ada peserta yang memenuhi syarat.", false);
                kocokanBtn.disabled = false;
                kocokanBtn.innerHTML = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
                lucide.createIcons();
                return;
            }

            pemenangDiv.classList.add('hidden');
            animasiDiv.classList.remove('hidden');
            showKocokanModal();

            let animationInterval = setInterval(() => {
                const randomIndex = Math.floor(Math.random() * eligiblePeserta.length);
                namaAnimasiEl.textContent = eligiblePeserta[randomIndex].nama;
            }, 50);

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
                    confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
                }, 500);

                kocokanBtn.disabled = false;
                kocokanBtn.innerHTML = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
                lucide.createIcons();
            }, 4500);

        } catch (error) {
            showToast("Gagal melakukan proses kocokan.", false);
            kocokanBtn.disabled = false;
            kocokanBtn.innerHTML = '<i data-lucide="play-circle" class="h-5 w-5"></i><span>Lakukan Kocokan</span>';
            lucide.createIcons();
        }
    };

    kocokanBtn.addEventListener('click', handleKocokan);

    const getPengaturan = async () => { /* ... (fungsi sama) ... */ };
    const loadDashboardData = async () => { /* ... (fungsi sama) ... */ };
    loadDashboardData();
}

function initPesertaPage() { /* ... (kode tidak berubah) ... */ }
function initPengaturanPage() { /* ... (kode tidak berubah) ... */ }