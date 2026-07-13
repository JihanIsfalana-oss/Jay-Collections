-- ========================================================
-- BACKING DATABASE FOR DESIGN CATALOG MODULE (PHASE 6 GAP-01)
-- ========================================================

-- 1. Tabel Kategori Desain Undangan Digital
CREATE TABLE IF NOT EXISTS design_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabel Referensi Desain Undangan (Rujukan Layout Frontend Phase 5)
CREATE TABLE IF NOT EXISTS reference_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id INT REFERENCES design_categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL UNIQUE,
    thumbnail_url TEXT,
    preview_url TEXT, -- Link demo undangan interaktif
    config JSONB DEFAULT '{}'::jsonb, -- Konfigurasi JSONB untuk CSS, warna, font, dan dekorasi layout
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Rujukan Prompt AI untuk Tema (Rujukan FastAPI HuggingFace Prompt)
CREATE TABLE IF NOT EXISTS ai_prompt_templates (
    id SERIAL PRIMARY KEY,
    theme_name VARCHAR(100) NOT NULL UNIQUE,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL, -- Template dinamis dengan placeholder {groom}, {bride}, {style}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seeding awal data kategori katalog desain
INSERT INTO design_categories (name, slug, description) VALUES
('Minimalist & Clean', 'minimalist-clean', 'Layout bersih, berfokus pada ruang kosong, warna elegan, dan tipografi modern sans-serif.'),
('Rustic & Floral', 'rustic-floral', 'Tema pedesaan yang hangat dipadukan dengan dekorasi bunga cat air bernuansa romantis.'),
('Royal Gold & Luxury', 'royal-gold-luxury', 'Tema eksklusif menggunakan aksen warna emas berkilau, warna gelap beludru, dan border ornamen mewah.'),
('Cultural & Traditional', 'cultural-traditional', 'Desain terintegrasi adat daerah Indonesia (Jawa, Sunda, Minang, Bali) yang kaya akan makna filosofis.')
ON CONFLICT (slug) DO NOTHING;

-- Seeding awal template prompt AI generator untuk FastAPI microservice
INSERT INTO ai_prompt_templates (theme_name, system_prompt, user_prompt_template) VALUES
('Elegant Traditional', 'You are an AI wedding invitation design assistant. Generate color schemas, typography hierarchies, and background floral pattern concepts based on cultural requests.', 'Create an invitation layout metadata for bride: {bride}, groom: {groom}, with cultural vibe: {culture_style}. Output JSON with keys background_hex, accent_hex, font_family.'),
('Clean Modern', 'You are an AI assistant designed to formulate minimalist clean layout configuration parameters for Next.js SVG rendering engine.', 'Generate SVG styling configuration for modern design. Minimalist sans-serif theme with primary color {primary_color_preference}. Output raw config JSON.')
ON CONFLICT (theme_name) DO NOTHING;