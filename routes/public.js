const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: get all settings
async function getSettings() {
    try {
        const [rows] = await db.execute('SELECT setting_key, setting_value FROM site_settings');
        const s = {};
        rows.forEach(r => { s[r.setting_key] = r.setting_value || ''; });
        return s;
    } catch { return {}; }
}

// GET / — Landing page
router.get('/', async (req, res) => {
    try {
        const settings = await getSettings();
        // Latest berita
        const [berita] = await db.execute('SELECT * FROM berita_lainnya ORDER BY tanggal DESC LIMIT 3');
        // Latest kegiatan
        const [kegiatan] = await db.execute('SELECT * FROM info_kegiatan WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 3');
        // Latest realisasi
        const [realisasi] = await db.execute('SELECT * FROM kegiatan_realisasi ORDER BY tanggal DESC LIMIT 3');

        res.render('index', {
            title: (settings.site_name || 'PAFI Cabang Balikpapan') + ' - ' + (settings.site_tagline || 'Persatuan Ahli Farmasi Indonesia'),
            layout: 'layouts/main',
            settings,
            berita,
            kegiatan,
            realisasi
        });
    } catch (err) {
        console.error(err);
        res.render('index', {
            title: 'PAFI Cabang Balikpapan',
            layout: 'layouts/main',
            settings: {},
            berita: [],
            kegiatan: [],
            realisasi: []
        });
    }
});

// Profil Khusus & Visi Misi
router.get('/profil', async (req, res) => {
    try {
        const settings = await getSettings();
        res.render('profil', {
            title: 'Profil Organisasi - PAFI Balikpapan',
            layout: 'layouts/main',
            settings
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Struktur Organisasi
router.get('/struktur-organisasi', async (req, res) => {
    try {
        const settings = await getSettings();
        res.render('struktur', {
            title: 'Struktur Organisasi - PAFI Balikpapan',
            layout: 'layouts/main',
            settings
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Public berita page
router.get('/berita', async (req, res) => {
    try {
        const [berita] = await db.execute('SELECT * FROM berita_lainnya ORDER BY tanggal DESC');
        const [skp] = await db.execute('SELECT * FROM skp_info ORDER BY tanggal DESC');
        res.render('berita', {
            title: 'Berita & Info - PAFI Balikpapan',
            layout: 'layouts/main',
            berita, skp
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Public loker page
router.get('/loker', async (req, res) => {
    try {
        const [lowongan] = await db.execute('SELECT * FROM lowongan ORDER BY tanggal DESC');
        res.render('loker', {
            title: 'Lowongan Kerja - PAFI Balikpapan',
            layout: 'layouts/main',
            lowongan
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Public kegiatan page
router.get('/kegiatan', async (req, res) => {
    try {
        const [upcoming] = await db.execute('SELECT * FROM info_kegiatan WHERE is_active = TRUE ORDER BY created_at DESC');
        const [past] = await db.execute('SELECT * FROM kegiatan_realisasi ORDER BY tanggal DESC');
        res.render('kegiatan', {
            title: 'Kegiatan - PAFI Balikpapan',
            layout: 'layouts/main',
            upcoming, past
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Public pendaftaran kegiatan
router.get('/kegiatan/:id/daftar', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM info_kegiatan WHERE id = ? AND is_active = TRUE', [req.params.id]);
        if (rows.length === 0) {
            req.flash('error', 'Kegiatan tidak ditemukan');
            return res.redirect('/kegiatan');
        }
        res.render('pendaftaran-kegiatan', {
            title: 'Pendaftaran Kegiatan - PAFI Balikpapan',
            layout: 'layouts/main',
            kegiatan: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.redirect('/kegiatan');
    }
});

// POST pendaftaran kegiatan (public)
router.post('/kegiatan/:id/daftar', upload.fields([
    { name: 'upload_iuran', maxCount: 1 },
    { name: 'upload_bukti_transfer', maxCount: 1 }
]), async (req, res) => {
    try {
        const { nama_peserta, no_whatsapp, tempat_bekerja, kegiatan_id } = req.body;
        const iuran = req.files['upload_iuran'] ? req.files['upload_iuran'][0].filename : null;
        const transfer = req.files['upload_bukti_transfer'] ? req.files['upload_bukti_transfer'][0].filename : null;

        await db.execute(
            'INSERT INTO pendaftaran_kegiatan (kegiatan_id, nama_peserta, no_whatsapp, tempat_bekerja, upload_iuran, upload_bukti_transfer) VALUES (?,?,?,?,?,?)',
            [kegiatan_id, nama_peserta, no_whatsapp, tempat_bekerja, iuran, transfer]
        );

        req.flash('success', 'Pendaftaran berhasil! Terima kasih.');
        res.redirect('/kegiatan');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal mendaftar. Silakan coba lagi.');
        res.redirect('/kegiatan');
    }
});

module.exports = router;
