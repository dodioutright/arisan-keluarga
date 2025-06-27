import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ... (Fungsi Helper dan Routing tidak berubah) ...

// --- INISIALISASI HALAMAN DASHBOARD (DIROMBAK) ---
function initDashboardPage() {
    console.log("Initializing Dashboard Page...");
    
    // Ambil elemen UI kartu
    const totalPesertaEl = document.getElementById('total-peserta-card');
    const danaTerkumpulEl = document.getElementById('dana-terkumpul-card');
    const tanggalKocokanEl = document.getElementById('tanggal-kocokan-card');

    // Fungsi untuk mengambil data pengaturan dari Firestore
    const getPengaturan = async () => {
        const pengaturanRef = doc(db, "pengaturan", "umum");
        const docSnap = await getDoc(pengaturanRef);

        if (docSnap.exists()) {
            console.log("Pengaturan ditemukan:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("Pengaturan tidak ditemukan, menggunakan nilai default.");
            // Default: tanggal 1 bulan depan
            const now = new Date();
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 1);
            nextMonth.setDate(nextMonth.getDate() - 1);
            const year = nextMonth.getFullYear();
            const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
            const day = '01';

            return {
                biaya_per_peserta: 100000,
                tanggal_kocokan: `${year}-${month}-${day}`
            };
        }
    };

    // Fungsi untuk memuat semua data dashboard
    const loadDashboardData = async () => {
        try {
            // Ambil data pengaturan dan data peserta secara bersamaan
            const [pengaturan, pesertaSnap] = await Promise.all([
                getPengaturan(),
                getDocs(query(collection(db, "peserta"), where("aktif", "==", true)))
            ]);

            // 1. Update kartu Total Peserta
            const totalPeserta = pesertaSnap.size;
            totalPesertaEl.textContent = `${totalPeserta} Orang`;

            // 2. Hitung dan update kartu Dana Terkumpul
            const pesertaLunas = pesertaSnap.docs.filter(doc => doc.data().status_bayar === true).length;
            const biayaPerPeserta = pengaturan.biaya_per_peserta;
            const totalDana = pesertaLunas * biayaPerPeserta;

            danaTerkumpulEl.textContent = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0
            }).format(totalDana);

            // 3. Format dan update kartu Tanggal Kocokan
            const tanggalDb = pengaturan.tanggal_kocokan; // Format YYYY-MM-DD
            // Tambahkan T00:00:00 untuk menghindari masalah timezone
            const tanggal = new Date(tanggalDb + 'T00:00:00'); 
            tanggalKocokanEl.textContent = tanggal.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

        } catch (error) {
            console.error("Gagal memuat data dashboard:", error);
            totalPesertaEl.textContent = 'Error';
            danaTerkumpulEl.textContent = 'Error';
            tanggalKocokanEl.textContent = 'Error';
        }
    };

    loadDashboardData();
}


// --- Blok kode lain (initLoginPage, initCommonElements, initPesertaPage) tidak berubah ---

function initLoginPage() { /* ... */ }
function initCommonElements(user) { /* ... */ }
function initPesertaPage() { /* ... */ }