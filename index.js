require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// ✅ Servir archivos adjuntos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
const pacientesRoutes = require('./routes/pacientes');
app.use('/pacientes', pacientesRoutes);

const personasRoutes = require('./routes/personasRoutes');
app.use('/personas', personasRoutes);

const tiposRegistroRoutes = require('./routes/tiposRegistro');
app.use('/tipos-registro', tiposRegistroRoutes);

const historiaClinicaRoutes = require('./routes/historiaClinica');
app.use('/historia', historiaClinicaRoutes);

// Static files para admin-panel
app.use(express.static(path.join(__dirname, 'public/admin-panel')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin-panel/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
