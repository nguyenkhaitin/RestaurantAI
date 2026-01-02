-- ==========================================
-- MIGRATION SCRIPT: ROSTER MODULE (Xếp lịch làm việc)
-- ==========================================
-- Database: postgres (PostgreSQL)
-- Purpose: Create shift template and roster assignment tables
-- Author: Senior Fullstack Developer
-- Date: 2025-12-28
-- ==========================================

-- 1. CREATE SHIFT TEMPLATES TABLE (Cấu hình ca)
-- ==========================================
CREATE TABLE IF NOT EXISTS cau_hinh_ca (
    id SERIAL PRIMARY KEY,
    ten_ca VARCHAR(50) NOT NULL,
    gio_bat_dau TIME NOT NULL,
    gio_ket_thuc TIME NOT NULL,
    so_luong_max INTEGER NOT NULL DEFAULT 5,
    CONSTRAINT check_max_capacity CHECK (so_luong_max >= 1)
);

-- Add comment for documentation
COMMENT ON TABLE cau_hinh_ca IS 'Shift templates configuration (Ca Sáng, Ca Chiều, etc.)';
COMMENT ON COLUMN cau_hinh_ca.ten_ca IS 'Shift name (e.g., Ca Sáng)';
COMMENT ON COLUMN cau_hinh_ca.gio_bat_dau IS 'Shift start time (24-hour format)';
COMMENT ON COLUMN cau_hinh_ca.gio_ket_thuc IS 'Shift end time (24-hour format)';
COMMENT ON COLUMN cau_hinh_ca.so_luong_max IS 'Maximum staff capacity per shift (number of slots to display)';

-- 2. CREATE ROSTER ASSIGNMENTS TABLE (Lịch làm việc)
-- ==========================================
-- Drop old table if exists (cleanup from previous structure)
DROP TABLE IF EXISTS lich_lam_viec;

CREATE TABLE lich_lam_viec (
    id SERIAL PRIMARY KEY,
    nhan_vien_id INTEGER NOT NULL,
    ca_lam_id INTEGER NOT NULL,
    ngay_lam DATE NOT NULL,
    chi_nhanh_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nhan_vien FOREIGN KEY (nhan_vien_id) REFERENCES nhan_vien(id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_lam FOREIGN KEY (ca_lam_id) REFERENCES cau_hinh_ca(id) ON DELETE RESTRICT,
    CONSTRAINT fk_chi_nhanh FOREIGN KEY (chi_nhanh_id) REFERENCES chi_nhanh(id) ON DELETE SET NULL,
    CONSTRAINT unique_assignment UNIQUE (nhan_vien_id, ngay_lam, ca_lam_id)
);

-- Add comment for documentation
COMMENT ON TABLE lich_lam_viec IS 'Staff roster assignments (who works which shift on which date)';
COMMENT ON COLUMN lich_lam_viec.nhan_vien_id IS 'Staff ID (foreign key to nhan_vien)';
COMMENT ON COLUMN lich_lam_viec.ca_lam_id IS 'Shift template ID (foreign key to cau_hinh_ca)';
COMMENT ON COLUMN lich_lam_viec.ngay_lam IS 'Work date (YYYY-MM-DD)';
COMMENT ON COLUMN lich_lam_viec.chi_nhanh_id IS 'Branch ID (optional, foreign key to chi_nhanh)';
COMMENT ON CONSTRAINT unique_assignment ON lich_lam_viec IS 'Prevents assigning same staff to multiple shifts on same date';

-- 3. INSERT SAMPLE SHIFT TEMPLATES
-- ==========================================
INSERT INTO cau_hinh_ca (ten_ca, gio_bat_dau, gio_ket_thuc, so_luong_max) VALUES
    ('Ca Sáng', '06:00', '14:00', 3),
    ('Ca Chiều', '14:00', '22:00', 3),
    ('Ca Tối', '18:00', '02:00', 2)
ON CONFLICT DO NOTHING;

-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_lich_lam_viec_ngay_lam ON lich_lam_viec(ngay_lam);
CREATE INDEX IF NOT EXISTS idx_lich_lam_viec_ca_lam_id ON lich_lam_viec(ca_lam_id);
CREATE INDEX IF NOT EXISTS idx_lich_lam_viec_nhan_vien_id ON lich_lam_viec(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_lich_lam_viec_composite ON lich_lam_viec(ca_lam_id, ngay_lam);

-- 5. VERIFICATION QUERIES
-- ==========================================
-- Check shift templates
SELECT 'Shift Templates Count:' as check_name, COUNT(*) as result FROM cau_hinh_ca;

-- Check roster table structure
SELECT 'Roster Table Columns:' as check_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lich_lam_viec' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 'Unique Constraint:' as check_name, conname as constraint_name
FROM pg_constraint 
WHERE conrelid = 'lich_lam_viec'::regclass 
AND contype = 'u';

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================
-- Next steps:
-- 1. Restart backend server: python backend/main.py
-- 2. Navigate to HR Management > Xếp lịch làm việc
-- 3. Click "Quản lý ca làm" to create custom shifts
-- 4. Click "+ Thêm" in any cell to assign staff
-- ==========================================
