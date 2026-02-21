const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const [members] = await db.execute('SELECT * FROM members ORDER BY created_at DESC');
        const [totalMembers] = await db.execute('SELECT COUNT(*) as count FROM members');
        const [lunasCount] = await db.execute("SELECT COUNT(*) as count FROM members WHERE iuran_status = 'Lunas'");
        const [belumLunas] = await db.execute("SELECT COUNT(*) as count FROM members WHERE iuran_status = 'Belum Lunas'");

        const search = req.query.search || '';
        let filteredMembers = members;
        if (search) {
            const s = search.toLowerCase();
            filteredMembers = members.filter(m =>
                m.nama.toLowerCase().includes(s) ||
                (m.no_ktan && m.no_ktan.toLowerCase().includes(s)) ||
                (m.tempat_bekerja && m.tempat_bekerja.toLowerCase().includes(s))
            );
        }

        res.render('admin/dashboard', {
            title: 'Dashboard Admin - PAFI Balikpapan',
            layout: 'layouts/admin',
            members: filteredMembers,
            stats: {
                total: totalMembers[0].count,
                lunas: lunasCount[0].count,
                belumLunas: belumLunas[0].count
            },
            search
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memuat data');
        res.redirect('/');
    }
});

// Postcard view
router.get('/members/:id', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM members WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            req.flash('error', 'Anggota tidak ditemukan');
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/postcard', {
            title: 'Kartu Anggota - PAFI Balikpapan',
            layout: 'layouts/admin',
            member: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

// Edit member
router.get('/members/:id/edit', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM members WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            req.flash('error', 'Anggota tidak ditemukan');
            return res.redirect('/admin/dashboard');
        }
        res.render('admin/edit', {
            title: 'Edit Anggota - PAFI Balikpapan',
            layout: 'layouts/admin',
            member: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

router.post('/members/:id/edit', async (req, res) => {
    try {
        const {
            nama, tempat_lahir, tanggal_lahir, tempat_bekerja,
            kategori_tempat_bekerja, kampus, provinsi_kampus,
            ijazah_kefarmasian, no_str, no_sip, masa_aktif_sip,
            no_ktan, no_whatsapp, jenis_kartu, golongan_darah, iuran_status, status_member
        } = req.body;

        await db.execute(
            `UPDATE members SET nama=?, tempat_lahir=?, tanggal_lahir=?, tempat_bekerja=?, 
       kategori_tempat_bekerja=?, kampus=?, provinsi_kampus=?, ijazah_kefarmasian=?, 
       no_str=?, no_sip=?, masa_aktif_sip=?, no_ktan=?, no_whatsapp=?, jenis_kartu=?, golongan_darah=?, iuran_status=?, status_member=? 
       WHERE id=?`,
            [nama, tempat_lahir, tanggal_lahir, tempat_bekerja,
                kategori_tempat_bekerja, kampus, provinsi_kampus,
                ijazah_kefarmasian, no_str, no_sip, masa_aktif_sip || null,
                no_ktan, no_whatsapp, jenis_kartu, golongan_darah || null, iuran_status, status_member || 'Pending', req.params.id]
        );

        req.flash('success', 'Data anggota berhasil diperbarui');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memperbarui data');
        res.redirect('/admin/dashboard');
    }
});

// Delete member
router.get('/members/:id/delete', async (req, res) => {
    try {
        await db.execute('DELETE FROM members WHERE id = ?', [req.params.id]);
        req.flash('success', 'Data anggota berhasil dihapus');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal menghapus data');
    }
    res.redirect('/admin/dashboard');
});

// Approve member
router.get('/members/:id/approve', async (req, res) => {
    try {
        await db.execute("UPDATE members SET status_member='Aktif' WHERE id = ?", [req.params.id]);
        req.flash('success', 'Anggota berhasil diterima/diaktifkan');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memproses data');
    }
    res.redirect('/admin/dashboard');
});

// Reject member
router.get('/members/:id/reject', async (req, res) => {
    try {
        await db.execute("UPDATE members SET status_member='Ditolak' WHERE id = ?", [req.params.id]);
        req.flash('success', 'Anggota telah ditolak');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memproses data');
    }
    res.redirect('/admin/dashboard');
});

// Toggle iuran status
router.get('/members/:id/iuran-lunas', async (req, res) => {
    try {
        await db.execute("UPDATE members SET iuran_status='Lunas' WHERE id = ?", [req.params.id]);
        req.flash('success', 'Iuran ditandai sebagai Lunas');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memproses');
    }
    res.redirect('/admin/members/' + req.params.id);
});

router.get('/members/:id/iuran-belum', async (req, res) => {
    try {
        await db.execute("UPDATE members SET iuran_status='Belum Lunas' WHERE id = ?", [req.params.id]);
        req.flash('success', 'Iuran ditandai sebagai Belum Lunas');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memproses');
    }
    res.redirect('/admin/members/' + req.params.id);
});

// Filter: Kategori Pekerjaan
router.get('/filter/kategori', async (req, res) => {
    try {
        const [rekap] = await db.execute(
            'SELECT kategori_tempat_bekerja, COUNT(*) as jumlah FROM members GROUP BY kategori_tempat_bekerja ORDER BY jumlah DESC'
        );
        const kategori = req.query.kategori || '';
        let members = [];
        if (kategori) {
            const [rows] = await db.execute('SELECT * FROM members WHERE kategori_tempat_bekerja = ?', [kategori]);
            members = rows;
        }
        res.render('admin/filter', {
            title: 'Filter Kategori Pekerjaan',
            layout: 'layouts/admin',
            filterType: 'Kategori Pekerjaan',
            rekap,
            members,
            filterField: 'kategori',
            selectedFilter: kategori
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

// Filter: Iuran Lunas
router.get('/filter/iuran', async (req, res) => {
    try {
        const [rekap] = await db.execute(
            'SELECT iuran_status, COUNT(*) as jumlah FROM members GROUP BY iuran_status'
        );
        const status = req.query.status || '';
        let members = [];
        if (status) {
            const [rows] = await db.execute('SELECT * FROM members WHERE iuran_status = ?', [status]);
            members = rows;
        }
        res.render('admin/filter', {
            title: 'Filter Iuran',
            layout: 'layouts/admin',
            filterType: 'Status Iuran',
            rekap: rekap.map(r => ({ kategori_tempat_bekerja: r.iuran_status, jumlah: r.jumlah })),
            members,
            filterField: 'status',
            selectedFilter: status
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

// Filter: Masa Aktif SIP
router.get('/filter/sip', async (req, res) => {
    try {
        const now = new Date().toISOString().split('T')[0];
        const [expiredCount] = await db.execute('SELECT COUNT(*) as jumlah FROM members WHERE masa_aktif_sip < ?', [now]);
        const [activeCount] = await db.execute('SELECT COUNT(*) as jumlah FROM members WHERE masa_aktif_sip >= ?', [now]);
        const [noDataCount] = await db.execute('SELECT COUNT(*) as jumlah FROM members WHERE masa_aktif_sip IS NULL');

        const rekap = [
            { kategori_tempat_bekerja: 'SIP Aktif', jumlah: activeCount[0].jumlah },
            { kategori_tempat_bekerja: 'SIP Expired', jumlah: expiredCount[0].jumlah },
            { kategori_tempat_bekerja: 'Belum Ada Data', jumlah: noDataCount[0].jumlah }
        ];

        const status = req.query.status || '';
        let members = [];
        if (status === 'aktif') {
            const [rows] = await db.execute('SELECT * FROM members WHERE masa_aktif_sip >= ?', [now]);
            members = rows;
        } else if (status === 'expired') {
            const [rows] = await db.execute('SELECT * FROM members WHERE masa_aktif_sip < ?', [now]);
            members = rows;
        }

        res.render('admin/filter', {
            title: 'Filter Masa Aktif SIP',
            layout: 'layouts/admin',
            filterType: 'Masa Aktif SIP',
            rekap,
            members,
            filterField: 'status',
            selectedFilter: status
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

// Filter: Asal Kampus
router.get('/filter/kampus', async (req, res) => {
    try {
        const [rekap] = await db.execute(
            'SELECT kampus AS kategori_tempat_bekerja, COUNT(*) as jumlah FROM members GROUP BY kampus ORDER BY jumlah DESC'
        );
        const kampus = req.query.kampus || '';
        let members = [];
        if (kampus) {
            const [rows] = await db.execute('SELECT * FROM members WHERE kampus = ?', [kampus]);
            members = rows;
        }
        res.render('admin/filter', {
            title: 'Filter Asal Kampus',
            layout: 'layouts/admin',
            filterType: 'Asal Kampus/Universitas',
            rekap,
            members,
            filterField: 'kampus',
            selectedFilter: kampus
        });
    } catch (err) {
        console.error(err);
        res.redirect('/admin/dashboard');
    }
});

module.exports = router;
