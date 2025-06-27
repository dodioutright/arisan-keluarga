// Import fungsi yang kita butuhkan dari Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// --- KONFIGURASI FIREBASE ---
// TODO: Ganti dengan konfigurasi Firebase proyekmu!
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


// --- ROUTING & PENGECEKAN AUTENTIKASI ---
const currentPage = window.location.pathname.split('/').pop();

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Pengguna sudah login
        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'dashboard.html';
        } else if (currentPage === 'dashboard.html') {
            initDashboard(user);
        }
    } else {
        // Pengguna belum login
        if (currentPage === 'dashboard.html') {
            window.location.href = 'index.html';
        }
    }
});


// --- LOGIKA HALAMAN LOGIN ---
if (currentPage === 'index.html' || currentPage === '') {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = '';

            signInWithEmailAndPassword(auth, email, password)
                .catch((error) => {
                    errorMessage.textContent = 'Email atau password salah. Coba lagi.';
                });
        });
    }
}


// --- LOGIKA HALAMAN DASHBOARD ---
function initDashboard(user) {
    // --- Elemen UI ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const sidebarContent = document.getElementById('sidebar-content');
    const closeSidebarButton = document.getElementById('close-sidebar-button');
    const userEmailElement = document.getElementById('user-email');
    const logoutButtonDesktop = document.getElementById('logout-button-desktop');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    const pesertaListElement = document.getElementById('peserta-list');
    const totalPesertaCard = document.getElementById('total-peserta-card');
    
    // --- Logika Buka/Tutup Sidebar ---
    const openSidebar = () => {
        if (!mobileSidebar || !sidebarContent) return;
        document.body.style.overflow = 'hidden';
        mobileSidebar.classList.remove('opacity-0', 'pointer-events-none');
        sidebarContent.classList.remove('translate-x-full');
    };

    const closeSidebar = () => {
        if (!mobileSidebar || !sidebarContent) return;
        document.body.style.overflow = '';
        sidebarContent.classList.add('translate-x-full');
        mobileSidebar.classList.add('opacity-0');
        // Tunggu transisi selesai sebelum menonaktifkan pointer events
        setTimeout(() => {
            mobileSidebar.classList.add('pointer-events-none');
        }, 300); 
    };

    if (mobileMenuButton) mobileMenuButton.addEventListener('click', openSidebar);
    if (closeSidebarButton) closeSidebarButton.addEventListener('click', closeSidebar);
    // Tutup sidebar jika klik di luar area konten (overlay)
    if (mobileSidebar) {
        mobileSidebar.addEventListener('click', (event) => {
            if (event.target === mobileSidebar) {
                closeSidebar();
            }
        });
    }

    // Tampilkan email pengguna
    if(userEmailElement) userEmailElement.textContent = user.email;

    // Fungsi Logout
    const handleLogout = () => signOut(auth).catch((error) => console.error("Error logout:", error));
    if (logoutButtonDesktop) logoutButtonDesktop.addEventListener('click', handleLogout);
    if (logoutButtonMobile) logoutButtonMobile.addEventListener('click', handleLogout);

    // Fungsi untuk memuat data peserta dari Firestore
    async function loadPeserta() {
        if (!pesertaListElement) return;
        try {
            const querySnapshot = await getDocs(collection(db, "peserta"));
            pesertaListElement.innerHTML = ''; 
            if (querySnapshot.empty) {
                pesertaListElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada data peserta.</td></tr>`;
                if(totalPesertaCard) totalPesertaCard.textContent = '0 Orang';
                return;
            }
            let counter = 1;
            querySnapshot.forEach((doc) => {
                const peserta = doc.data();
                const row = `
                    <tr class="hover:bg-slate-50">
                        <td class="p-4 text-slate-500">${counter++}</td>
                        <td class="p-4 font-medium text-slate-800">${peserta.nama}</td>
                        <td class="p-4">
                            <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                peserta.status_bayar ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                            }">
                                ${peserta.status_bayar ? 'Sudah Bayar' : 'Belum Bayar'}
                            </span>
                        </td>
                        <td class="p-4 text-slate-600">${peserta.status_menang ? 'Sudah Menang' : 'Belum'}</td>
                    </tr>
                `;
                pesertaListElement.innerHTML += row;
            });
            if(totalPesertaCard) totalPesertaCard.textContent = `${querySnapshot.size} Orang`;
        } catch (error) {
            console.error("Error memuat data peserta: ", error);
            pesertaListElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        }
    }
    
    // Panggil fungsi untuk memuat data
    loadPeserta();
}