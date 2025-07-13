const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /tipos-registro → devuelve lista de tipos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tipos_registro ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener tipos de registro');
  }
});

module.exports = router;
