const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');

// Obtener todas las personas
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM personas ORDER BY id');
  res.json(result.rows);
});

// 🔥 Obtener persona por ID (nuevo)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM personas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en servidor.' });
  }
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

// 🔥 Actualizar persona por ID (nuevo)
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dni, telefono, mail } = req.body;

  if (!nombre || !apellido || !dni) {
    return res.status(400).json({ error: 'Datos obligatorios faltantes.' });
  }

  try {
    await pool.query(
      'UPDATE personas SET nombre = $1, apellido = $2, dni = $3, telefono = $4, mail = $5 WHERE id = $6',
      [nombre, apellido, dni, telefono, mail, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar persona.' });
  }
});

// Eliminar persona
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM personas WHERE id = $1', [req.params.id]);
  res.sendStatus(204);
});

// Actualizar contraseña
router.post('/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE personas SET password = $1 WHERE id = $2',
      [hash, id]
    );
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    console.error('Error al actualizar contraseña:', err);
    res.status(500).json({ error: 'Error en servidor.' });
  }
});

module.exports = router;

