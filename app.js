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

// --- FUNGSI HELPERS & INISIALISASI HALAMAN (Tidak berubah) ---
// ...

// --- INISIALISASI HALAMAN PESERTA (DIROMBAK) ---
function initPesertaPage() {
    // --- Elemen DOM ---
    const listElement = document.getElementById('peserta-list-manajemen');
    const totalPesertaText = document.getElementById('total-peserta-text');
    // Modal Tambah/Edit
    const modal = document.getElementById('peserta-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('peserta-form');
    const pesertaIdInput = document.getElementById('peserta-id');
    const namaPesertaInput = document.getElementById('nama-peserta');
    const statusBayarToggle = document.getElementById('status-bayar-toggle');
    const statusMenangToggle = document.getElementById('status-menang-toggle');
    // Modal Hapus
    const deleteModal = document.getElementById('delete-modal');
    let docIdToDelete = null;

    // --- Fungsi Modal (Tidak berubah) ---
    const showModal = (target) => { /* ... */ };
    const hideModal = (target) => { /* ... */ };

    // --- Event Listeners Tombol Utama & Modal ---
    document.getElementById('add-peserta-btn').addEventListener('click', () => {
        form.reset();
        pesertaIdInput.value = '';
        modalTitle.textContent = 'Tambah Peserta Baru';
        statusBayarToggle.checked = false;
        statusMenangToggle.checked = false;
        showModal(modal);
    });
    // ... event listeners lain untuk modal ...

    // --- Buka Modal Edit (Logika Baru) ---
    const openEditModal = (id, data) => {
        form.reset();
        pesertaIdInput.value = id;
        namaPesertaInput.value = data.nama;
        statusBayarToggle.checked = data.status_bayar;
        statusMenangToggle.checked = data.status_menang;
        modalTitle.textContent = 'Ubah Data Peserta';
        showModal(modal);
    };
    
    // --- Submit Form (Logika Baru) ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = pesertaIdInput.value;
        const dataToSave = {
            nama: namaPesertaInput.value,
            status_bayar: statusBayarToggle.checked,
            status_menang: statusMenangToggle.checked
        };
        
        try {
            if (id) { // Mode Edit
                await updateDoc(doc(db, 'peserta', id), dataToSave);
                showToast('Data berhasil diperbarui!');
            } else { // Mode Tambah
                await addDoc(collection(db, 'peserta'), dataToSave);
                showToast('Peserta baru ditambahkan!');
            }
            hideModal(modal);
            loadPeserta();
        } catch (error) { showToast('Terjadi kesalahan', false); }
    });

    // --- Hapus Peserta (Tidak berubah) ---
    // ...

    // --- Memuat Data Peserta (Struktur Tabel) ---
    const loadPeserta = async () => {
        if (!listElement) return;
        listElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Memuat...</td></tr>`;
        
        const querySnapshot = await getDocs(collection(db, "peserta"));
        listElement.innerHTML = ''; // Kosongkan tabel
        
        // Update total peserta
        totalPesertaText.textContent = `Total ${querySnapshot.size} anggota aktif.`;

        if (querySnapshot.empty) {
            listElement.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-500">Belum ada peserta.</td></tr>`;
            return;
        }

        querySnapshot.forEach(d => {
            const data = d.data();
            const tr = listElement.insertRow();
            tr.className = 'hover:bg-slate-50';
            
            // Kolom Nama
            tr.insertCell().innerHTML = `<div class="p-4 font-medium text-slate-800">${data.nama}</div>`;
            
            // Kolom Status Iuran
            tr.insertCell().innerHTML = `<div class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_bayar ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">${data.status_bayar ? 'Lunas' : 'Menunggu'}</span></div>`;
            
            // Kolom Status Menang
            tr.insertCell().innerHTML = `<div class="p-4"><span class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${data.status_menang ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'}">${data.status_menang ? 'Sudah' : 'Belum'}</span></div>`;
            
            // Kolom Aksi
            const cellAksi = tr.insertCell();
            cellAksi.className = 'p-4 text-right';
            cellAksi.innerHTML = `
                <button class="edit-btn p-2 rounded-md hover:bg-slate-100 text-slate-600"><i data-lucide="edit" class="h-4 w-4 pointer-events-none"></i></button>
                <button class="delete-btn p-2 rounded-md hover:bg-red-100 text-red-600"><i data-lucide="trash-2" class="h-4 w-4 pointer-events-none"></i></button>
            `;
            
            // Tambah event listeners untuk tombol aksi
            cellAksi.querySelector('.edit-btn').addEventListener('click', () => openEditModal(d.id, data));
            cellAksi.querySelector('.delete-btn').addEventListener('click', () => {
                docIdToDelete = d.id;
                showModal(deleteModal);
            });
        });
        lucide.createIcons();
    };

    loadPeserta();
}