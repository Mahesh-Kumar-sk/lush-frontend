const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // serve site root

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function readJSON(file, fallback){ try{ if(!fs.existsSync(file)){ fs.writeFileSync(file, JSON.stringify(fallback||[],null,2)); return fallback||[] } return JSON.parse(fs.readFileSync(file)) } catch(e){ return fallback||[] } }
function writeJSON(file, data){ fs.writeFileSync(file, JSON.stringify(data,null,2)) }

// Create order
app.post('/create-order', (req, res) => {
  const order = req.body;
  if (!order || !order.items || !order.shipping) return res.status(400).json({ success:false, error:'invalid' });
  const orders = readJSON(ORDERS_FILE, []);
  const id = 'ORD-' + Date.now();
  order.orderId = id;
  order.createdAt = new Date().toISOString();
  order.status = 'pending';
  orders.push(order);
  writeJSON(ORDERS_FILE, orders);
  console.log('Order received', id);
  res.json({ success:true, orderId: id });
});

// Admin: simple password protected endpoint to get orders
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'admin123';
app.get('/admin/orders', (req, res) => {
  const pw = req.query.pw || req.headers['x-admin-password'] || '';
  if (pw !== ADMIN_PW) return res.status(401).json({ error:'unauthorized' });
  const orders = readJSON(ORDERS_FILE, []);
  res.json(orders);
});

// Serve admin page
app.get('/admin.html', (req,res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, ()=> console.log('Server running on', port));