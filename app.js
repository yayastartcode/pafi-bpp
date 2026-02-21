require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'pafi_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Flash messages + global vars
app.use(flash());
const db = require('./config/database');
app.use(async (req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.user = req.session.user || null;
    // Fetch site settings for layouts (logo, site_name)
    try {
        const [rows] = await db.execute("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('logo','site_name','site_tagline')");
        const siteInfo = {};
        rows.forEach(r => { siteInfo[r.setting_key] = r.setting_value || ''; });
        res.locals.siteLogo = siteInfo.logo || '';
        res.locals.siteName = siteInfo.site_name || 'PAFI Cabang Balikpapan';
    } catch {
        res.locals.siteLogo = '';
        res.locals.siteName = 'PAFI Cabang Balikpapan';
    }
    res.locals.member = req.session.member || null;
    next();
});

// Routes
const authRoutes = require('./routes/auth');
const registerRoutes = require('./routes/register');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const organisasiRoutes = require('./routes/organisasi');
const settingsRoutes = require('./routes/settings');
const memberRoutes = require('./routes/member');
const publicRoutes = require('./routes/public');

app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', registerRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', contentRoutes);
app.use('/admin', organisasiRoutes);
app.use('/admin/settings', settingsRoutes);
app.use('/member', memberRoutes);

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: '404 - Halaman Tidak Ditemukan', layout: 'layouts/main' });
});

app.listen(PORT, () => {
    console.log(`🚀 PAFI Balikpapan server running at http://localhost:${PORT}`);
});
