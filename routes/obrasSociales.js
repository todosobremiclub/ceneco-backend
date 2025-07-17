const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/verificarToken');

// Obtener todas las obras sociales
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM obras_sociales ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ [GET /obras-sociales] Error:', err);
    res.status(500).send('Error al obtener obras sociales');
  }
});

// Crear una obra social
router.post('/', verificarToken, async (req, res) => {
  const { nombre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO obras_sociales (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ [POST /obras-sociales] Error:', err);
    res.status(500).send('Error al crear obra social');
  }
});

// Eliminar una obra social
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM obras_sociales WHERE id = $1', [id]);
    res.send('Obra social eliminada');
  } catch (err) {
    console.error('❌ [DELETE /obras-sociales/:id] Error:', err);
    res.status(500).send('Error al eliminar obra social');
  }
});

module.exports = router;
