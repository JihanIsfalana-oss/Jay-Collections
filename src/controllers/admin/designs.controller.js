import pool from '../../config/db.js';

// ========================================================
// CATEGORIES
// ========================================================

// 1. LIST KATEGORI DESAIN
export const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM design_categories ORDER BY display_order, name'
    );
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Categories:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data kategori.' });
  }
};

// 2. CREATE KATEGORI
export const createCategory = async (req, res) => {
  const { name, slug, description, thumbnail_url, display_order } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!name || !slug) {
    return res.status(400).json({ status: 'error', message: 'name dan slug wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO design_categories (name, slug, description, thumbnail_url, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, slug, description || null, thumbnail_url || null, display_order || 0]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'CREATE_DESIGN_CATEGORY', 'design_categories', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ name, slug })]
    );

    res.status(201).json({ status: 'success', message: 'Kategori berhasil dibuat.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Create Category:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat kategori.' });
  }
};

// 3. UPDATE KATEGORI
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, slug, description, thumbnail_url, is_active, display_order } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;
  const updates = [];
  const params = [];
  let paramIndex = 0;

  if (name !== undefined) { paramIndex++; updates.push(`name = $${paramIndex}`); params.push(name); }
  if (slug !== undefined) { paramIndex++; updates.push(`slug = $${paramIndex}`); params.push(slug); }
  if (description !== undefined) { paramIndex++; updates.push(`description = $${paramIndex}`); params.push(description); }
  if (thumbnail_url !== undefined) { paramIndex++; updates.push(`thumbnail_url = $${paramIndex}`); params.push(thumbnail_url); }
  if (is_active !== undefined) { paramIndex++; updates.push(`is_active = $${paramIndex}`); params.push(is_active); }
  if (display_order !== undefined) { paramIndex++; updates.push(`display_order = $${paramIndex}`); params.push(display_order); }

  if (updates.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Tidak ada data yang diupdate.' });
  }

  try {
    paramIndex++;
    params.push(id);
    const result = await pool.query(
      `UPDATE design_categories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan.' });

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'UPDATE_DESIGN_CATEGORY', 'design_categories', $2, $3)`,
      [adminId, id, JSON.stringify(req.body)]
    );

    res.status(200).json({ status: 'success', message: 'Kategori berhasil diupdate.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Update Category:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate kategori.' });
  }
};

// 4. DELETE KATEGORI
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const result = await pool.query('DELETE FROM design_categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Kategori tidak ditemukan.' });

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id)
       VALUES ($1, 'DELETE_DESIGN_CATEGORY', 'design_categories', $2)`,
      [adminId, id]
    );

    res.status(200).json({ status: 'success', message: 'Kategori berhasil dihapus.' });
  } catch (error) {
    console.error('[ERROR] Delete Category:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus kategori.' });
  }
};

// ========================================================
// DESIGN REFERENCES
// ========================================================

// 5. LIST REFERENSI DESAIN
export const getDesigns = async (req, res) => {
  const { category_id } = req.query;

  try {
    let query = `SELECT dr.*, dc.name AS category_name, dc.slug AS category_slug
                 FROM design_references dr
                 JOIN design_categories dc ON dc.id = dr.category_id`;
    const params = [];

    if (category_id) {
      query += ' WHERE dr.category_id = $1';
      params.push(category_id);
    }

    query += ' ORDER BY dr.is_featured DESC, dr.view_count DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Designs:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil data desain.' });
  }
};

// 6. CREATE REFERENSI DESAIN
export const createDesign = async (req, res) => {
  const { category_id, title, thumbnail_url, description, style_tags, ai_style_prompt, is_featured } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;

  if (!category_id || !title || !thumbnail_url) {
    return res.status(400).json({ status: 'error', message: 'category_id, title, dan thumbnail_url wajib diisi.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO design_references (category_id, title, thumbnail_url, description, style_tags, ai_style_prompt, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [category_id, title, thumbnail_url, description || null, style_tags || [], ai_style_prompt || null, is_featured || false]
    );

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'CREATE_DESIGN_REFERENCE', 'design_references', $2, $3)`,
      [adminId, result.rows[0].id, JSON.stringify({ title, category_id })]
    );

    res.status(201).json({ status: 'success', message: 'Referensi desain berhasil dibuat.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Create Design:', error);
    res.status(500).json({ status: 'error', message: 'Gagal membuat referensi desain.' });
  }
};

// 7. UPDATE REFERENSI DESAIN
export const updateDesign = async (req, res) => {
  const { id } = req.params;
  const { category_id, title, thumbnail_url, description, style_tags, ai_style_prompt, is_featured, is_active } = req.body;
  const adminId = req.admin.admin_id || req.admin.id;
  const updates = [];
  const params = [];
  let paramIndex = 0;

  if (category_id !== undefined) { paramIndex++; updates.push(`category_id = $${paramIndex}`); params.push(category_id); }
  if (title !== undefined) { paramIndex++; updates.push(`title = $${paramIndex}`); params.push(title); }
  if (thumbnail_url !== undefined) { paramIndex++; updates.push(`thumbnail_url = $${paramIndex}`); params.push(thumbnail_url); }
  if (description !== undefined) { paramIndex++; updates.push(`description = $${paramIndex}`); params.push(description); }
  if (style_tags !== undefined) { paramIndex++; updates.push(`style_tags = $${paramIndex}`); params.push(style_tags); }
  if (ai_style_prompt !== undefined) { paramIndex++; updates.push(`ai_style_prompt = $${paramIndex}`); params.push(ai_style_prompt); }
  if (is_featured !== undefined) { paramIndex++; updates.push(`is_featured = $${paramIndex}`); params.push(is_featured); }
  if (is_active !== undefined) { paramIndex++; updates.push(`is_active = $${paramIndex}`); params.push(is_active); }

  if (updates.length === 0) return res.status(400).json({ status: 'error', message: 'Tidak ada data diupdate.' });

  try {
    paramIndex++;
    params.push(id);
    const result = await pool.query(
      `UPDATE design_references SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Desain tidak ditemukan.' });

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id, details)
       VALUES ($1, 'UPDATE_DESIGN_REFERENCE', 'design_references', $2, $3)`,
      [adminId, id, JSON.stringify(req.body)]
    );

    res.status(200).json({ status: 'success', message: 'Desain berhasil diupdate.', data: result.rows[0] });
  } catch (error) {
    console.error('[ERROR] Update Design:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengupdate desain.' });
  }
};

// 8. DELETE REFERENSI DESAIN
export const deleteDesign = async (req, res) => {
  const { id } = req.params;
  const adminId = req.admin.admin_id || req.admin.id;

  try {
    const result = await pool.query('DELETE FROM design_references WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ status: 'error', message: 'Desain tidak ditemukan.' });

    await pool.query(
      `INSERT INTO admin_audit_logs (admin_id, action, target_table, target_id)
       VALUES ($1, 'DELETE_DESIGN_REFERENCE', 'design_references', $2)`,
      [adminId, id]
    );

    res.status(200).json({ status: 'success', message: 'Desain berhasil dihapus.' });
  } catch (error) {
    console.error('[ERROR] Delete Design:', error);
    res.status(500).json({ status: 'error', message: 'Gagal menghapus desain.' });
  }
};
