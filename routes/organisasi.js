const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ============ PERSURATAN ============
router.get('/persuratan', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM persuratan ORDER BY tanggal DESC');
    res.render('admin/persuratan-list', { title: 'Persuratan', layout: 'layouts/admin', items: rows });
});

router.get('/persuratan/tambah', (req, res) => {
    res.render('admin/persuratan-form', { title: 'Tambah Surat', layout: 'layouts/admin', item: null });
});

router.post('/persuratan/tambah', upload.single('upload_surat'), async (req, res) => {
    try {
        const { asal_surat, tanggal, isi_surat } = req.body;
        const file = req.file ? req.file.filename : null;
        await db.execute('INSERT INTO persuratan (asal_surat, tanggal, isi_surat, upload_surat) VALUES (?,?,?,?)',
            [asal_surat, tanggal, isi_surat, file]);
        req.flash('success', 'Surat berhasil ditambahkan');
        res.redirect('/admin/persuratan');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/persuratan'); }
});

router.get('/persuratan/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM persuratan WHERE id = ?', [req.params.id]);
    req.flash('success', 'Surat dihapus');
    res.redirect('/admin/persuratan');
});

// ============ MUTASI ANGGOTA ============
router.get('/mutasi', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM mutasi_anggota ORDER BY tanggal DESC');
    const [masuk] = await db.execute("SELECT COUNT(*) as c FROM mutasi_anggota WHERE tipe='Masuk'");
    const [keluar] = await db.execute("SELECT COUNT(*) as c FROM mutasi_anggota WHERE tipe='Keluar'");
    res.render('admin/mutasi-list', {
        title: 'Data Mutasi Anggota', layout: 'layouts/admin', items: rows,
        masuk: masuk[0].c, keluar: keluar[0].c
    });
});

router.get('/mutasi/tambah', (req, res) => {
    res.render('admin/mutasi-form', { title: 'Tambah Data Mutasi', layout: 'layouts/admin', item: null });
});

router.post('/mutasi/tambah', async (req, res) => {
    try {
        const { nama_anggota, daerah_asal, tujuan, tipe, tanggal } = req.body;
        await db.execute('INSERT INTO mutasi_anggota (nama_anggota, daerah_asal, tujuan, tipe, tanggal) VALUES (?,?,?,?,?)',
            [nama_anggota, daerah_asal, tujuan, tipe, tanggal]);
        req.flash('success', 'Data mutasi ditambahkan');
        res.redirect('/admin/mutasi');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/mutasi'); }
});

router.get('/mutasi/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM mutasi_anggota WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/mutasi');
});

// ============ SURAT REKOMENDASI ============
router.get('/rekomendasi', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM surat_rekomendasi ORDER BY created_at DESC');
    res.render('admin/rekomendasi-list', { title: 'Surat Rekomendasi', layout: 'layouts/admin', items: rows });
});

router.get('/rekomendasi/tambah', (req, res) => {
    res.render('admin/rekomendasi-form', { title: 'Buat Surat Rekomendasi', layout: 'layouts/admin', item: null });
});

router.post('/rekomendasi/tambah', async (req, res) => {
    try {
        const { nama_anggota, tempat_lahir, tanggal_lahir, no_ktan, alamat, keperluan } = req.body;
        await db.execute(
            'INSERT INTO surat_rekomendasi (nama_anggota, tempat_lahir, tanggal_lahir, no_ktan, alamat, keperluan) VALUES (?,?,?,?,?,?)',
            [nama_anggota, tempat_lahir, tanggal_lahir, no_ktan, alamat, keperluan]);
        req.flash('success', 'Surat rekomendasi berhasil dibuat');
        res.redirect('/admin/rekomendasi');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/rekomendasi'); }
});

router.get('/rekomendasi/:id', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM surat_rekomendasi WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.redirect('/admin/rekomendasi');
    res.render('admin/rekomendasi-print', { title: 'Cetak Surat Rekomendasi', layout: false, item: rows[0] });
});

router.get('/rekomendasi/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM surat_rekomendasi WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/rekomendasi');
});

module.exports = router;
