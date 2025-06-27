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
    apiKey: "AIzaSy...YOUR_API_KEY",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "1:your-app-id:web:your-web-app-id"
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
        console.log("Pengguna login:", user.email);
        if (currentPage === 'index.html' || currentPage === '') {
            // Jika di halaman login, arahkan ke dashboard
            window.location.href = 'dashboard.html';
        } else if (currentPage === 'dashboard.html') {
            // Jika di dashboard, jalankan fungsi dashboard
            initDashboard(user);
        }
    } else {
        // Pengguna belum login
        console.log("Pengguna belum login.");
        if (currentPage === 'dashboard.html') {
            // Jika mencoba akses dashboard, tendang ke halaman login
            window.location.href = 'index.html';
        }
    }
});


// --- LOGIKA HALAMAN LOGIN ---
if (currentPage === 'index.html' || currentPage === '') {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;
            
            errorMessage.textContent = ''; // Kosongkan pesan error

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    // Berhasil login, onAuthStateChanged akan menangani redirect
                    console.log("Login berhasil!", userCredential.user);
                })
                .catch((error) => {
                    console.error("Error login:", error.message);
                    errorMessage.textContent = 'Email atau password salah. Coba lagi.';
                });
        });
    }
}


// --- LOGIKA HALAMAN DASHBOARD ---
function initDashboard(user) {
    // --- Elemen Navigasi ---
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    const userEmailElement = document.getElementById('user-email');
    const logoutButtonDesktop = document.getElementById('logout-button-desktop');
    const logoutButtonMobile = document.getElementById('logout-button-mobile');
    
    // --- Elemen Konten ---
    const pesertaListElement = document.getElementById('peserta-list');
    const totalPesertaCard = document.getElementById('total-peserta-card');
    
    // --- Logika Menu Mobile ---
    if(mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Tampilkan email pengguna
    if(userEmailElement) userEmailElement.textContent = user.email;

    // Fungsi Logout
    const handleLogout = () => {
        signOut(auth).catch((error) => console.error("Error logout:", error));
    };

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
            
            // Update kartu total peserta
            if(totalPesertaCard) totalPesertaCard.textContent = `${querySnapshot.size} Orang`;

        } catch (error) {
            console.error("Error memuat data peserta: ", error);
            pesertaListElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Gagal memuat data.</td></tr>`;
        }
    }
    
    // Panggil fungsi untuk memuat data
    loadPeserta();
}