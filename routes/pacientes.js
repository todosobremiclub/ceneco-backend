const express = require('express');
const router = express.Router();
const pool = require('../db');

// Obtener un paciente por ID (necesario para editar)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        id,
        numero_paciente,
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento)) AS edad,
        psicopedagoga,
        supervisora
      FROM pacientes
      WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).send('Paciente no encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener paciente por ID');
  }
});

// Obtener todos los pacientes con edad calculada
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        numero_paciente,
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, fecha_nacimiento)) AS edad,
        psicopedagoga,
        supervisora
      FROM pacientes
      ORDER BY numero_paciente
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener pacientes');
  }
});

// Crear paciente
router.post('/', async (req, res) => {
  const { numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO pacientes (numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear paciente');
  }
});

// Editar paciente con validación DNI único
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora } = req.body;
  try {
    const existente = await pool.query(
      'SELECT 1 FROM pacientes WHERE dni = $1 AND id != $2',
      [dni, id]
    );
    if (existente.rowCount > 0) {
      return res.status(400).json({ error: 'El DNI ya está registrado en otro paciente.' });
    }

    await pool.query(`
      UPDATE pacientes
      SET numero_paciente=$1, nombre=$2, apellido=$3, dni=$4, fecha_nacimiento=$5, psicopedagoga=$6, supervisora=$7
      WHERE id=$8
    `, [numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, id]);

    res.send('Paciente actualizado');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar paciente');
  }
});

// Eliminar paciente
router.delete('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM pacientes WHERE id=$1', [id]);
    res.send('Paciente eliminado');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar paciente');
  }
});

module.exports = router;

