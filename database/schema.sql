-- PAFI Cabang Balikpapan - Database Schema
-- Run: mysql -u root pafi_db < database/schema.sql

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  tempat_bekerja VARCHAR(150),
  kategori_tempat_bekerja VARCHAR(100),
  kampus VARCHAR(150),
  provinsi_kampus VARCHAR(100),
  ijazah_kefarmasian VARCHAR(100),
  no_str VARCHAR(50),
  no_sip VARCHAR(50),
  masa_aktif_sip DATE,
  no_ktan VARCHAR(50),
  no_whatsapp VARCHAR(20),
  foto VARCHAR(255),
  bukti_transfer VARCHAR(255),
  jenis_kartu VARCHAR(50),
  golongan_darah VARCHAR(10),
  iuran_status ENUM('Lunas','Belum Lunas') DEFAULT 'Belum Lunas',
  status_member ENUM('Pending','Aktif','Ditolak') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kegiatan_realisasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  nama_kegiatan VARCHAR(200) NOT NULL,
  ketua_panitia VARCHAR(100),
  jumlah_peserta INT,
  foto1 VARCHAR(255),
  foto2 VARCHAR(255),
  foto3 VARCHAR(255),
  foto4 VARCHAR(255),
  foto5 VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS info_kegiatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kegiatan VARCHAR(200) NOT NULL,
  bidang VARCHAR(100),
  tujuan TEXT,
  target_peserta INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pendaftaran_kegiatan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kegiatan_id INT,
  nama_peserta VARCHAR(100) NOT NULL,
  no_whatsapp VARCHAR(20),
  tempat_bekerja VARCHAR(150),
  upload_iuran VARCHAR(255),
  upload_bukti_transfer VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kegiatan_id) REFERENCES info_kegiatan(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lowongan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE NOT NULL,
  asal_sumber VARCHAR(200),
  upload_file VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skp_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(200) NOT NULL,
  tanggal DATE NOT NULL,
  konten TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS berita_lainnya (
  id INT AUTO_INCREMENT PRIMARY KEY,
  judul VARCHAR(200) NOT NULL,
  tanggal DATE NOT NULL,
  konten TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS persuratan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asal_surat VARCHAR(200) NOT NULL,
  tanggal DATE NOT NULL,
  isi_surat TEXT,
  upload_surat VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mutasi_anggota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_anggota VARCHAR(100) NOT NULL,
  daerah_asal VARCHAR(100),
  tujuan VARCHAR(100),
  tipe ENUM('Masuk','Keluar') NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS surat_rekomendasi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_anggota VARCHAR(100) NOT NULL,
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  no_ktan VARCHAR(50),
  alamat TEXT,
  keperluan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(100) PRIMARY KEY,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default site settings
INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
('site_name', 'PAFI Cabang Balikpapan'),
('site_tagline', 'Persatuan Ahli Farmasi Indonesia'),
('logo', ''),
('hero_bg', ''),
('hero_title', 'PAFI Cabang Balikpapan'),
('hero_subtitle', 'Bersama memajukan profesi kefarmasian di Kota Balikpapan. Bergabunglah bersama kami untuk membangun komunitas farmasi yang profesional dan berdaya.'),
('hero_btn_text', 'Daftar Anggota'),
('hero_btn_link', '/daftar'),
('visi', 'Menjadi organisasi profesi farmasi yang profesional, mandiri, dan berkontribusi dalam peningkatan derajat kesehatan masyarakat Kota Balikpapan.'),
('misi', 'Meningkatkan kompetensi dan profesionalisme anggota|Menyelenggarakan kegiatan ilmiah dan pendidikan berkelanjutan|Memperkuat jejaring dan kerjasama antar stakeholder'),
('contact_address', 'Balikpapan, Kalimantan Timur'),
('contact_email', 'pafi.balikpapan@gmail.com'),
('contact_whatsapp', ''),
('footer_text', 'Persatuan Ahli Farmasi Indonesia Cabang Balikpapan. Bersama memajukan profesi kefarmasian di Kota Balikpapan.');
