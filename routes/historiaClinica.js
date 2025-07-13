const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Obtener historia clínica de un paciente
router.get('/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const result = await pool.query(
      `SELECT fecha, tipo, 
         CASE 
           WHEN archivo IS NOT NULL THEN archivo 
           ELSE contenido 
         END AS contenido
       FROM historia_clinica
       WHERE paciente_id = $1
       ORDER BY fecha ASC`,
      [pacienteId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener historia clínica');
  }
});

// Guardar nueva línea en historia clínica (texto simple)
router.post('/', async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  try {
    await pool.query(
      'INSERT INTO historia_clinica (paciente_id, tipo, contenido, fecha) VALUES ($1, $2, $3, NOW())',
      [paciente_id, tipo, contenido]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar registro en historia clínica');
  }
});

// Guardar línea con archivo
router.post('/documento', upload.single('archivo'), async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  const archivo = req.file ? req.file.filename : null;
  try {
    await pool.query(
      'INSERT INTO historia_clinica (paciente_id, tipo, contenido, archivo, fecha) VALUES ($1, $2, $3, $4, NOW())',
      [paciente_id, tipo, contenido, archivo]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar registro con archivo');
  }
});

module.exports = router;
