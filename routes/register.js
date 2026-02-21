const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/database');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan'));
    }
});

// GET /daftar
router.get('/daftar', (req, res) => {
    res.render('register', { title: 'Pendaftaran Anggota - PAFI Balikpapan', layout: 'layouts/main' });
});

// POST /daftar
router.post('/daftar', upload.single('foto'), async (req, res) => {
    try {
        const b = req.body;

        // Check username uniqueness
        const [existing] = await db.execute('SELECT id FROM members WHERE username = ?', [b.username]);
        if (existing.length > 0) {
            req.flash('error', 'Username sudah digunakan. Silakan pilih username lain.');
            return res.redirect('/daftar');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(b.password, 10);
        const foto = req.file ? req.file.filename : null;

        await db.execute(
            `INSERT INTO members (nama, username, password, tempat_lahir, tanggal_lahir, tempat_bekerja, 
       kategori_tempat_bekerja, kampus, provinsi_kampus, ijazah_kefarmasian, 
       no_str, no_sip, masa_aktif_sip, no_ktan, no_whatsapp, foto, jenis_kartu, golongan_darah, iuran_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                b.nama || null, b.username, hashedPassword,
                b.tempat_lahir || null, b.tanggal_lahir || null, b.tempat_bekerja || null,
                b.kategori_tempat_bekerja || null, b.kampus || null, b.provinsi_kampus || null,
                b.ijazah_kefarmasian || null, b.no_str || null, b.no_sip || null, b.masa_aktif_sip || null,
                b.no_ktan || null, b.no_whatsapp || null, foto, b.jenis_kartu || null,
                b.golongan_darah || null, 'Belum Lunas'
            ]
        );

        req.flash('success', 'Pendaftaran berhasil! Silakan login dengan username & password Anda untuk melengkapi pembayaran iuran.');
        res.redirect('/member/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
        res.redirect('/daftar');
    }
});

module.exports = router;
