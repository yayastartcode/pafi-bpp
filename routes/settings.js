const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => {
        let prefix = 'file';
        if (file.fieldname === 'logo_file') prefix = 'logo';
        else if (file.fieldname === 'hero_bg_file') prefix = 'hero';
        else if (file.fieldname === 'struktur_org_img_file') prefix = 'struktur';
        cb(null, prefix + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: get all settings as object
async function getSettings() {
    const [rows] = await db.execute('SELECT setting_key, setting_value FROM site_settings');
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value || ''; });
    return settings;
}

// Helper: update a single setting
async function updateSetting(key, value) {
    await db.execute(
        'INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
        [key, value, value]
    );
}

// GET settings page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const settings = await getSettings();
        res.render('admin/settings', {
            title: 'Pengaturan Situs - Admin',
            layout: 'layouts/admin',
            settings
        });
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal memuat pengaturan');
        res.redirect('/admin/dashboard');
    }
});

// POST update settings
router.post('/', isAuthenticated, upload.fields([
    { name: 'logo_file', maxCount: 1 },
    { name: 'hero_bg_file', maxCount: 1 },
    { name: 'struktur_org_img_file', maxCount: 1 }
]), async (req, res) => {
    try {
        const fields = [
            'site_name', 'site_tagline',
            'hero_title', 'hero_subtitle', 'hero_btn_text', 'hero_btn_link',
            'visi', 'misi', 'profil_text',
            'contact_address', 'contact_whatsapp', 'contact_website',
            'contact_facebook', 'contact_instagram', 'contact_youtube',
            'footer_text'
        ];

        // Update text fields
        for (const key of fields) {
            if (req.body[key] !== undefined) {
                await updateSetting(key, req.body[key]);
            }
        }

        // Update logo if uploaded
        if (req.files['logo_file'] && req.files['logo_file'][0]) {
            await updateSetting('logo', req.files['logo_file'][0].filename);
        }

        // Update hero bg if uploaded
        if (req.files['hero_bg_file'] && req.files['hero_bg_file'][0]) {
            await updateSetting('hero_bg', req.files['hero_bg_file'][0].filename);
        }

        // Update struktur org image if uploaded
        if (req.files['struktur_org_img_file'] && req.files['struktur_org_img_file'][0]) {
            await updateSetting('struktur_org_img', req.files['struktur_org_img_file'][0].filename);
        }

        req.flash('success', 'Pengaturan berhasil disimpan');
        res.redirect('/admin/settings');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Gagal menyimpan pengaturan');
        res.redirect('/admin/settings');
    }
});

// Export helper for use in other routes
router.getSettings = getSettings;

module.exports = router;
