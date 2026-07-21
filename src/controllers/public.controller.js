import pool from '../config/db.js';

export const getPublicCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, description, thumbnail_url, updated_at 
       FROM design_categories 
       WHERE is_active = true 
       ORDER BY display_order, name`
    );
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Public Categories:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil kategori.' });
  }
};

export const getPublicDesigns = async (req, res) => {
  const { category_id } = req.query;
  try {
    let query = `SELECT dr.id, dr.title, dr.thumbnail_url, dr.description, dr.style_tags, dr.is_featured
                 FROM design_references dr
                 JOIN design_categories dc ON dc.id = dr.category_id
                 WHERE dr.is_active = true AND dc.is_active = true`;
    const params = [];
    if (category_id) {
      query += ' AND dr.category_id = $1';
      params.push(category_id);
    }
    query += ' ORDER BY dr.is_featured DESC, dr.view_count DESC';

    const result = await pool.query(query, params);
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (error) {
    console.error('[ERROR] Get Public Designs:', error);
    res.status(500).json({ status: 'error', message: 'Gagal mengambil desain.' });
  }
};