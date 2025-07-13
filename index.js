require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// API routes
const pacientesRoutes = require('./routes/pacientes');
app.use('/pacientes', pacientesRoutes);

// ✅ Servir archivos estáticos desde /public/admin-panel como raíz web
app.use(express.static(path.join(__dirname, 'public/admin-panel')));

// 🔔 Servir correctamente el fallback para SPA solo en rutas que no sean archivos
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin-panel/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

