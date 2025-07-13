const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_registro ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener tipos de registro');
  }
});

router.post('/', async (req, res) => {
  const { nombre } = req.body;
  try {
    await pool.query('INSERT INTO tipos_registro (nombre) VALUES ($1)', [nombre]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar tipo');
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tipos_registro WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar tipo');
  }
});

module.exports = router;
