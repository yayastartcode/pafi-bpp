const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

// GET /login
router.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/admin/dashboard');
    res.render('login', { title: 'Login Admin - PAFI Balikpapan', layout: 'layouts/auth' });
});

// POST /login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) {
            req.flash('error', 'Username atau password salah');
            return res.redirect('/login');
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            req.flash('error', 'Username atau password salah');
            return res.redirect('/login');
        }

        req.session.user = { id: user.id, username: user.username, role: user.role };
        req.flash('success', 'Login berhasil!');
        res.redirect('/admin/dashboard');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Terjadi kesalahan server');
        res.redirect('/login');
    }
});

// GET /logout
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
