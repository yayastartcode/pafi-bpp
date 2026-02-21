const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const db = require('../config/database');

// Multer for bukti transfer upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, 'bukti-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware: check member login
function isMember(req, res, next) {
    if (req.session.member) return next();
    req.flash('error', 'Silakan login terlebih dahulu');
    res.redirect('/member/login');
}

// GET /member/login
router.get('/login', (req, res) => {
    if (req.session.member) return res.redirect('/member/dashboard');
    res.render('member/login', { title: 'Login Anggota - PAFI Balikpapan', layout: 'layouts/main' });
});

// POST /member/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.execute('SELECT * FROM members WHERE username = ?', [username]);
        if (rows.length === 0) {
            req.flash('error', 'Username tidak ditemukan');
            return res.redirect('/member/login');
        }
        const member = rows[0];
        const match = await bcrypt.compare(password, member.password);
        if (!match) {
            req.flash('error', 'Password salah');
            return res.redirect('/member/login');
        }
        req.session.member = { id: member.id, username: member.username, nama: member.nama };
        res.redirect('/member/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Terjadi kesalahan. Silakan coba lagi.');
        res.redirect('/member/login');
    }
});

// GET /member/logout
router.get('/logout', (req, res) => {
    req.session.member = null;
    res.redirect('/member/login');
});

// GET /member/dashboard
router.get('/dashboard', isMember, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM members WHERE id = ?', [req.session.member.id]);
        if (rows.length === 0) {
            req.session.member = null;
            return res.redirect('/member/login');
        }
        res.render('member/dashboard', {
            title: 'Dashboard Anggota - PAFI Balikpapan',
            layout: 'layouts/main',
            member: rows[0]
        });
    } catch (err) {
        console.error(err);
        res.redirect('/member/login');
    }
});

// POST /member/upload-bukti
router.post('/upload-bukti', isMember, upload.single('bukti_transfer'), async (req, res) => {
    try {
        if (!req.file) {
            req.flash('error', 'File bukti transfer wajib diupload');
            return res.redirect('/member/dashboard');
        }
        await db.execute('UPDATE members SET bukti_transfer = ? WHERE id = ?', [req.file.filename, req.session.member.id]);
        req.flash('success', 'Bukti transfer berhasil diupload! Admin akan memverifikasi pembayaran Anda.');
        res.redirect('/member/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal mengupload bukti transfer');
        res.redirect('/member/dashboard');
    }
});

module.exports = router;
