import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const port = Number(process.env.PORT || 4000);
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '32kb' }));

const pool = mysql.createPool({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'barangay_security', waitForConnections: true, connectionLimit: 5, queueLimit: 0 });
const api = express.Router();
api.get('/status', async (_req, res) => {
  let database = 'not_connected';
  try { await pool.query('SELECT 1'); database = 'connected'; } catch { database = 'not_connected'; }
  res.json({ backend: 'connected', database, device: 'not_integrated' });
});
api.get('/dashboard/summary', async (_req, res, next) => {
  try {
    const [[h]] = await pool.query('SELECT COUNT(*) AS total FROM households');
    const [[a]] = await pool.query('SELECT COUNT(*) AS total, SUM(status = \'Pending\') AS pending, SUM(status = \'Resolved\') AS resolved FROM alerts');
    res.json({ households: h.total, alerts: a.total, pending: Number(a.pending || 0), resolved: Number(a.resolved || 0) });
  } catch (e) { next(e); }
});
const alertSelect = `SELECT a.id, CONCAT('ALT-', LPAD(a.id, 5, '0')) AS alert_code, a.household_id, h.name AS household_name, h.address, a.device_id, a.event_type, a.description, a.status, a.is_read, a.created_at FROM alerts a LEFT JOIN households h ON h.id = a.household_id`;
api.get('/alerts', async (_req, res, next) => {
  try { const [rows] = await pool.query(`${alertSelect} ORDER BY a.created_at DESC`); res.json({ alerts: rows }); } catch (e) { next(e); }
});
api.get('/alerts/:id', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`${alertSelect} WHERE a.id = ?`, [req.params.id]); if (!rows.length) return res.status(404).json({error:'Alert not found.'});
    const [updates] = await pool.query('SELECT id, status, note, created_at FROM incident_updates WHERE alert_id = ? ORDER BY created_at DESC', [req.params.id]);
    await pool.query('UPDATE alerts SET is_read = TRUE WHERE id = ?', [req.params.id]); res.json({alert:{...rows[0],updates}});
  } catch (e) { next(e); }
});
api.patch('/alerts/:id', async (req, res, next) => {
  const { status, note, is_read } = req.body || {};
  if (status !== undefined && !['Pending','Under Review','Responding','Resolved'].includes(status)) return res.status(400).json({error:'Choose a valid incident status.'});
  if (note !== undefined && (typeof note !== 'string' || note.length > 5000)) return res.status(400).json({error:'Response notes must be under 5,000 characters.'});
  if (is_read !== undefined && typeof is_read !== 'boolean') return res.status(400).json({error:'is_read must be true or false.'});
  try {
    const connection=await pool.getConnection(); try { await connection.beginTransaction(); const [found]=await connection.query('SELECT id FROM alerts WHERE id = ? FOR UPDATE',[req.params.id]); if(!found.length){await connection.rollback();return res.status(404).json({error:'Alert not found.'});} if(status)await connection.query('UPDATE alerts SET status = ? WHERE id = ?',[status,req.params.id]); if(is_read!==undefined)await connection.query('UPDATE alerts SET is_read = ? WHERE id = ?',[is_read,req.params.id]); if(note?.trim())await connection.query('INSERT INTO incident_updates (alert_id, status, note) VALUES (?, ?, ?)',[req.params.id,status||null,note.trim()]); await connection.commit(); res.json({success:true}); } catch(e){await connection.rollback();throw e;} finally{connection.release();}
  } catch(e){next(e);}
});
api.get('/households', async (_req,res,next)=>{try{const [households]=await pool.query('SELECT id,name,address,contact,created_at FROM households ORDER BY created_at DESC');res.json({households});}catch(e){next(e);}});
api.post('/households', async (req,res,next)=>{const {name,address,contact=''}=req.body||{};if(typeof name!=='string'||!name.trim()||name.length>160||typeof address!=='string'||!address.trim()||address.length>255||typeof contact!=='string'||contact.length>40)return res.status(400).json({error:'Provide a household name and address. Check field lengths.'});try{const [result]=await pool.query('INSERT INTO households (name,address,contact) VALUES (?,?,?)',[name.trim(),address.trim(),contact.trim()||null]);res.status(201).json({household:{id:result.insertId,name:name.trim(),address:address.trim(),contact:contact.trim()}});}catch(e){next(e);}});
// Future ESP32 integration endpoint. Protect it with device authentication before deployment.
api.post('/device/alerts', async (req,res,next)=>{if(!process.env.DEVICE_API_KEY)return res.status(503).json({error:'Device alert ingestion is not configured.'});if(req.get('x-device-key')!==process.env.DEVICE_API_KEY)return res.status(401).json({error:'Invalid device credentials.'});const {household_id,device_id,event_type='Possible Intrusion Detected',description=''}=req.body||{};if(!device_id||typeof device_id!=='string'||typeof event_type!=='string')return res.status(400).json({error:'device_id and event_type are required.'});try{const [result]=await pool.query('INSERT INTO alerts (household_id,device_id,event_type,description,source) VALUES (?,?,?,?,\'device\')',[household_id||null,device_id.slice(0,100),event_type.slice(0,120),String(description).slice(0,5000)]);res.status(201).json({id:result.insertId});}catch(e){next(e);}});
app.use('/api',api);
app.get('/health',(_req,res)=>res.json({ok:true}));
app.use((err,_req,res,_next)=>{console.error(err.message);res.status(503).json({error:'Database unavailable or request failed. Check the backend and MySQL connection.'});});
app.listen(port,()=>console.log(`Barangay Watch API listening on http://localhost:${port}`));
