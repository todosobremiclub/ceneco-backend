require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// API REST
const pacientesRoutes = require('./routes/pacientes');
app.use('/pacientes', pacientesRoutes);

// 👉 Servir archivos estáticos (frontend) desde /public/admin-panel
app.use(express.static(path.join(__dirname, 'public/admin-panel')));

// 👉 Para que cualquier ruta no-API devuelva index.html (SPA-like behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin-panel/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

