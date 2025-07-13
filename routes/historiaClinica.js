const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración para guardar archivos subidos
const upload = multer({ dest: 'uploads/' });

// Obtener historia clínica de un paciente
router.get('/:pacienteId', async (req, res) => {
  const { pacienteId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historia_clinica WHERE paciente_id = $1 ORDER BY fecha ASC',
      [pacienteId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener historia clínica');
  }
});

// Agregar línea a historia clínica (texto o diagnóstico o estudio)
router.post('/', async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  try {
    await pool.query(
      'INSERT INTO historia_clinica (paciente_id, tipo, contenido) VALUES ($1, $2, $3)',
      [paciente_id, tipo, contenido]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar entrada de historia clínica');
  }
});

// Subir documento
router.post('/documento', upload.single('archivo'), async (req, res) => {
  const { paciente_id } = req.body;
  const archivo = req.file;

  if (!archivo) {
    return res.status(400).send('No se envió archivo');
  }

  const filePath = `/uploads/${archivo.filename}`;

  try {
    await pool.query(
      'INSERT INTO historia_clinica (paciente_id, tipo, contenido) VALUES ($1, $2, $3)',
      [paciente_id, 'documento', filePath]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar documento');
  }
});

module.exports = router;
