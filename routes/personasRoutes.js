const express = require('express');
const router = express.Router();
const pool = require('../db'); // Ajustar según tu conexión

// Obtener todas las personas
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM personas ORDER BY id');
  res.json(result.rows);
});

// Agregar persona
router.post('/', async (req, res) => {
  const { nombre, apellido, dni, telefono, mail, tipo } = req.body;
  if (!nombre || !apellido || !dni || !tipo) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes.' });
  }

  try {
    const existe = await pool.query('SELECT 1 FROM personas WHERE dni = $1', [dni]);
    if (existe.rowCount > 0) {
      return res.status(400).json({ error: 'El DNI ya existe.' });
    }

    await pool.query(
      'INSERT INTO personas (nombre, apellido, dni, telefono, mail, tipo) VALUES ($1, $2, $3, $4, $5, $6)',
      [nombre, apellido, dni, telefono, mail, tipo]
    );
    res.sendStatus(201);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al insertar persona.' });
  }
});

// Eliminar persona
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM personas WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

module.exports = router;
