const express = require('express');
const router = express.Router();
const pool = require('../db');

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

// Guardar nueva línea en historia clínica
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
    res.status(500).send('Error al guardar registro en historia clínica');
  }
});

module.exports = router;
