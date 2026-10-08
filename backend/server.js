const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5433/site_db'
});

const validateSite = (req, res, next) => {
  const { name, location, status } = req.body;
  if (!name || !name.trim() || !location || !location.trim()) {
    return res.status(400).json({ error: 'Site name and location are required fields.' });
  }
  if (status && !['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Active or Inactive.' });
  }
  next();
};

const validateInstallation = (req, res, next) => {
  const { site_id, activity_name, status } = req.body;
  if (!site_id || !activity_name || !activity_name.trim()) {
    return res.status(400).json({ error: 'Target site and activity name are required fields.' });
  }
  if (status && !['Pending', 'In Progress', 'Completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be Pending, In Progress, or Completed.' });
  }
  next();
};

app.get('/api/dashboard/summary', async (req, res) => {
  try {
    const totalSites = await pool.query('SELECT COUNT(*) FROM sites');
    const totalInstallations = await pool.query('SELECT COUNT(*) FROM installations');
    const activeInstallations = await pool.query("SELECT COUNT(*) FROM installations WHERE status = 'In Progress'");
    
    res.json({
      total_sites: parseInt(totalSites.rows[0].count, 10),
      total_installations: parseInt(totalInstallations.rows[0].count, 10),
      active_installations: parseInt(activeInstallations.rows[0].count, 10)
    });
  } catch (err) {
    console.error('Error fetching summary:', err.message);
    res.status(500).json({ error: 'Database error fetching summary metrics' });
  }
});

app.get('/api/sites', async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = 'SELECT * FROM sites WHERE 1=1';
    let params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }
    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }
    sql += ' ORDER BY id ASC';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching sites:', err.message);
    res.status(500).json({ error: 'Database error fetching sites' });
  }
});

app.post('/api/sites', validateSite, async (req, res) => {
  try {
    const { name, location, status } = req.body;
    const result = await pool.query(
      'INSERT INTO sites (name, location, status) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), location.trim(), status || 'Active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating site:', err.message);
    res.status(500).json({ error: 'Database error creating site' });
  }
});

app.put('/api/sites/:id', validateSite, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;
    const result = await pool.query(
      'UPDATE sites SET name = $1, location = $2, status = $3 WHERE id = $4 RETURNING *',
      [name.trim(), location.trim(), status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating site:', err.message);
    res.status(500).json({ error: 'Database error updating site' });
  }
});

app.delete('/api/sites/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM installations WHERE site_id = $1', [id]);
    const result = await pool.query('DELETE FROM sites WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Site not found' });
    }
    res.json({ message: 'Site and associated tasks deleted successfully' });
  } catch (err) {
    console.error('Error deleting site:', err.message);
    res.status(500).json({ error: 'Database error deleting site' });
  }
});

app.get('/api/installations', async (req, res) => {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT installations.id, installations.site_id, sites.name AS site_name, installations.activity_name, installations.status 
      FROM installations 
      JOIN sites ON installations.site_id = sites.id
      WHERE 1=1
    `;
    let params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (installations.activity_name ILIKE $${params.length} OR sites.name ILIKE $${params.length})`;
    }
    if (status && status !== 'All') {
      params.push(status);
      sql += ` AND installations.status = $${params.length}`;
    }
    sql += ' ORDER BY installations.id ASC';

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching installations:', err.message);
    res.status(500).json({ error: 'Database error fetching installations' });
  }
});

app.post('/api/installations', validateInstallation, async (req, res) => {
  try {
    const { site_id, activity_name, status } = req.body;
    const result = await pool.query(
      'INSERT INTO installations (site_id, activity_name, status) VALUES ($1, $2, $3) RETURNING *',
      [site_id, activity_name.trim(), status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating installation:', err.message);
    res.status(500).json({ error: 'Database error creating installation' });
  }
});

app.put('/api/installations/:id', validateInstallation, async (req, res) => {
  try {
    const { id } = req.params;
    const { site_id, activity_name, status } = req.body;
    const result = await pool.query(
      'UPDATE installations SET site_id = $1, activity_name = $2, status = $3 WHERE id = $4 RETURNING *',
      [site_id, activity_name.trim(), status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Installation task not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating installation:', err.message);
    res.status(500).json({ error: 'Database error updating installation' });
  }
});

app.delete('/api/installations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM installations WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Installation task not found' });
    }
    res.json({ message: 'Installation task deleted successfully' });
  } catch (err) {
    console.error('Error deleting installation:', err.message);
    res.status(500).json({ error: 'Database error deleting installation' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend server running on port ${PORT}`));