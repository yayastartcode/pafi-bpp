const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ============ KEGIATAN REALISASI ============
router.get('/kegiatan-realisasi', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM kegiatan_realisasi ORDER BY tanggal DESC');
    res.render('admin/kegiatan-list', { title: 'Kegiatan Terealisasi', layout: 'layouts/admin', items: rows });
});

router.get('/kegiatan-realisasi/tambah', (req, res) => {
    res.render('admin/kegiatan-form', { title: 'Tambah Kegiatan', layout: 'layouts/admin', item: null });
});

router.post('/kegiatan-realisasi/tambah', upload.fields([
    { name: 'foto1', maxCount: 1 }, { name: 'foto2', maxCount: 1 },
    { name: 'foto3', maxCount: 1 }, { name: 'foto4', maxCount: 1 },
    { name: 'foto5', maxCount: 1 }
]), async (req, res) => {
    try {
        const { tanggal, nama_kegiatan, ketua_panitia, jumlah_peserta } = req.body;
        const getFile = (name) => req.files[name] ? req.files[name][0].filename : null;
        await db.execute(
            'INSERT INTO kegiatan_realisasi (tanggal, nama_kegiatan, ketua_panitia, jumlah_peserta, foto1, foto2, foto3, foto4, foto5) VALUES (?,?,?,?,?,?,?,?,?)',
            [tanggal, nama_kegiatan, ketua_panitia, jumlah_peserta, getFile('foto1'), getFile('foto2'), getFile('foto3'), getFile('foto4'), getFile('foto5')]
        );
        req.flash('success', 'Kegiatan berhasil ditambahkan');
        res.redirect('/admin/kegiatan-realisasi');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/kegiatan-realisasi'); }
});

router.get('/kegiatan-realisasi/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM kegiatan_realisasi WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/kegiatan-realisasi');
});

// ============ INFO KEGIATAN ============
router.get('/info-kegiatan', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM info_kegiatan ORDER BY created_at DESC');
    res.render('admin/info-kegiatan-list', { title: 'Info Kegiatan', layout: 'layouts/admin', items: rows });
});

router.get('/info-kegiatan/tambah', (req, res) => {
    res.render('admin/info-kegiatan-form', { title: 'Tambah Info Kegiatan', layout: 'layouts/admin', item: null });
});

router.post('/info-kegiatan/tambah', async (req, res) => {
    try {
        const { nama_kegiatan, bidang, tujuan, target_peserta } = req.body;
        await db.execute('INSERT INTO info_kegiatan (nama_kegiatan, bidang, tujuan, target_peserta) VALUES (?,?,?,?)',
            [nama_kegiatan, bidang, tujuan, target_peserta]);
        req.flash('success', 'Info kegiatan ditambahkan');
        res.redirect('/admin/info-kegiatan');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/info-kegiatan'); }
});

router.get('/info-kegiatan/:id/toggle', async (req, res) => {
    await db.execute('UPDATE info_kegiatan SET is_active = NOT is_active WHERE id = ?', [req.params.id]);
    res.redirect('/admin/info-kegiatan');
});

router.get('/info-kegiatan/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM info_kegiatan WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/info-kegiatan');
});

// ============ PENDAFTARAN KEGIATAN (view only) ============
router.get('/pendaftaran-kegiatan', async (req, res) => {
    const [rows] = await db.execute(`
    SELECT pk.*, ik.nama_kegiatan 
    FROM pendaftaran_kegiatan pk 
    LEFT JOIN info_kegiatan ik ON pk.kegiatan_id = ik.id 
    ORDER BY pk.created_at DESC
  `);
    res.render('admin/pendaftaran-list', { title: 'Pendaftaran Kegiatan', layout: 'layouts/admin', items: rows });
});

// ============ LOWONGAN ============
router.get('/lowongan', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM lowongan ORDER BY tanggal DESC');
    res.render('admin/lowongan-list', { title: 'Lowongan Pekerjaan', layout: 'layouts/admin', items: rows });
});

router.get('/lowongan/tambah', (req, res) => {
    res.render('admin/lowongan-form', { title: 'Tambah Lowongan', layout: 'layouts/admin', item: null });
});

router.post('/lowongan/tambah', upload.single('upload_file'), async (req, res) => {
    try {
        const { tanggal, asal_sumber } = req.body;
        const file = req.file ? req.file.filename : null;
        await db.execute('INSERT INTO lowongan (tanggal, asal_sumber, upload_file) VALUES (?,?,?)', [tanggal, asal_sumber, file]);
        req.flash('success', 'Lowongan ditambahkan');
        res.redirect('/admin/lowongan');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/lowongan'); }
});

router.get('/lowongan/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM lowongan WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/lowongan');
});

// ============ SKP INFO ============
router.get('/skp', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM skp_info ORDER BY tanggal DESC');
    res.render('admin/skp-list', { title: 'Tata Cara SKP', layout: 'layouts/admin', items: rows });
});

router.get('/skp/tambah', (req, res) => {
    res.render('admin/skp-form', { title: 'Tambah Info SKP', layout: 'layouts/admin', item: null });
});

router.post('/skp/tambah', async (req, res) => {
    try {
        const { judul, tanggal, konten } = req.body;
        await db.execute('INSERT INTO skp_info (judul, tanggal, konten) VALUES (?,?,?)', [judul, tanggal, konten]);
        req.flash('success', 'Info SKP ditambahkan');
        res.redirect('/admin/skp');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/skp'); }
});

router.get('/skp/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM skp_info WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/skp');
});

// ============ BERITA LAINNYA ============
router.get('/berita', async (req, res) => {
    const [rows] = await db.execute('SELECT * FROM berita_lainnya ORDER BY tanggal DESC');
    res.render('admin/berita-list', { title: 'Berita Lainnya', layout: 'layouts/admin', items: rows });
});

router.get('/berita/tambah', (req, res) => {
    res.render('admin/berita-form', { title: 'Tambah Berita', layout: 'layouts/admin', item: null });
});

router.post('/berita/tambah', async (req, res) => {
    try {
        const { judul, tanggal, konten } = req.body;
        await db.execute('INSERT INTO berita_lainnya (judul, tanggal, konten) VALUES (?,?,?)', [judul, tanggal, konten]);
        req.flash('success', 'Berita ditambahkan');
        res.redirect('/admin/berita');
    } catch (err) { console.error(err); req.flash('error', 'Gagal menyimpan'); res.redirect('/admin/berita'); }
});

router.get('/berita/:id/hapus', async (req, res) => {
    await db.execute('DELETE FROM berita_lainnya WHERE id = ?', [req.params.id]);
    req.flash('success', 'Data dihapus');
    res.redirect('/admin/berita');
});

// ============ BERITA KEFARMASIAN (RSS) ============
router.get('/berita-kefarmasian', async (req, res) => {
    const Parser = require('rss-parser');
    const parser = new Parser({ timeout: 5000 });

    const feeds = [
        { name: 'Kemenkes RI', url: 'https://sehatnegeriku.kemkes.go.id/feed/' },
        { name: 'BPOM', url: 'https://www.pom.go.id/feed' }
    ];

    let allItems = [];
    for (const feed of feeds) {
        try {
            const data = await parser.parseURL(feed.url);
            const items = data.items.slice(0, 5).map(item => ({
                title: item.title,
                link: item.link,
                date: item.pubDate,
                source: feed.name
            }));
            allItems = allItems.concat(items);
        } catch (e) {
            console.error(`RSS error ${feed.name}:`, e.message);
        }
    }

    allItems.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.render('admin/berita-rss', {
        title: 'Berita Kefarmasian',
        layout: 'layouts/admin',
        items: allItems
    });
});

module.exports = router;
