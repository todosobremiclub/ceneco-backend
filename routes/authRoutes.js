const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const pool = require('../db');
const SECRET_KEY = process.env.SECRET_KEY || 'secreto';

// LOGIN ADMIN (supervisora)
router.post('/login/admin', async (req, res) => {
  const { dni, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM personas WHERE dni = $1 AND tipo = 'supervisora'",
      [dni]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const admin = result.rows[0];

    const match = await bcrypt.compare(password, admin.password || '');
    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { tipo: 'admin', id: admin.id, nombre: admin.nombre, apellido: admin.apellido },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error en /login/admin:', err);
    res.status(500).json({ message: 'Error en servidor' });
  }
});

// LOGIN USUARIO (psicopedagoga)
router.post('/login/usuario', async (req, res) => {
  const { dni, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM personas WHERE dni = $1 AND tipo = 'psicopedagoga'",
      [dni]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password || '');
    if (!match) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { tipo: 'user', id: user.id, nombre: user.nombre, apellido: user.apellido },
      SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error en /login/usuario:', err);
    res.status(500).json({ message: 'Error en servidor' });
  }
});

module.exports = router;

