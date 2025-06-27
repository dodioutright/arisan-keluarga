// Import fungsi Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Blok Inisialisasi dan Helper (Tidak berubah) ---
// ...

// --- INISIALISASI HALAMAN PESERTA (DIROMBAK) ---
function initPesertaPage() {
    // --- Elemen DOM ---
    const listBody = document.getElementById('peserta-list-manajemen');
    const totalText = document.getElementById('total-peserta-text');
    const modal = document.getElementById('peserta-modal');
    const deleteModal = document.getElementById('delete-modal');
    const form = document.getElementById('peserta-form');
    const idInput = document.getElementById('peserta-id');
    const nameInput = document.getElementById('nama-peserta');
    const bayarToggle = document.getElementById('status-bayar-toggle');
    // Variabel untuk toggle status menang dihilangkan
    let docIdToDelete = null;

    // --- Fungsi Modal & Tombol Utama (Tidak berubah) ---
    // ...

    // --- Submit Form (Logika Diperbarui) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = idInput.value;
        
        try {
            if (id) { // Mode Edit
                // HANYA update nama dan status_bayar
                const dataToUpdate = {
                    nama: nameInput.value,
                    status_bayar: bayarToggle.checked,
                };
                await updateDoc(doc(db, 'peserta', id), dataToUpdate);
                showToast('Data berhasil diperbarui!');
            } else { // Mode Tambah
                const newData = {
                    nama: nameInput.value,
                    status_bayar: bayarToggle.checked,
                    status_menang: false, // Default value untuk peserta baru
                    aktif: true
                };
                await addDoc(collection(db, 'peserta'), newData);
                showToast('Peserta baru ditambahkan!');
            }
            hideModal(modal);
            loadPeserta();
        } catch (error) { 
            console.error("Error menyimpan data:", error);
            showToast('Terjadi kesalahan', false); 
        }
    });

    // ... (Logika Hapus Peserta tidak berubah) ...

    // --- Memuat Data Peserta (Logika Diperbarui) ---
    const loadPeserta = async () => {
        if (!listBody) return;
        listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Memuat...</td></tr>`;
        
        const snap = await getDocs(collection(db, "peserta"));
        listBody.innerHTML = '';
        totalText.textContent = `Total ${snap.size} anggota aktif.`;
        if (snap.empty) {
            listBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
            return;
        }

        let counter = 1; // Inisialisasi nomor urut
        snap.forEach(d => {
            const data = d.data();
            const tr = listBody.insertRow();
            tr.className = 'hover:bg-slate-50';
            
            // Render sel tabel
            tr.innerHTML = `
                <td class="p-4 text-slate-500 text-center">${counter}</td>
                <td class="p-4 font-medium text-slate-800">${data.nama}</td>
                <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data.status_bayar ? 'Lunas' : 'Menunggu'}</span></td>
                <td class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${data.status_menang ? 'Sudah' : 'Belum'}</span></td>
                <td class="p-4 text-right">
                    <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i class="h-4 w-4" data-lucide="edit"></i></button>
                    <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i class="h-4 w-4" data-lucide="trash-2"></i></button>
                </td>
            `;
            
            // Event listener untuk tombol edit
            tr.querySelector('.edit-btn').addEventListener('click', () => {
                idInput.value = d.id;
                nameInput.value = data.nama;
                bayarToggle.checked = data.status_bayar;
                // Logika untuk mengisi toggle status menang dihilangkan
                document.getElementById('modal-title').textContent = 'Ubah Data Peserta';
                showModal(modal);
            });

            tr.querySelector('.delete-btn').addEventListener('click', () => {
                docIdToDelete = d.id;
                showModal(deleteModal);
            });

            counter++; // Naikkan nomor urut untuk baris berikutnya
        });
        lucide.createIcons();
    };

    loadPeserta();
}