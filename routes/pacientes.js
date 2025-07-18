const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/verificarToken');

// Middleware soloUser (para psicopedagogas)
function soloUser(req, res, next) {
  if (req.usuario.perfil !== 'usuario') {
    return res.status(403).send('Acceso permitido solo a psicopedagogas');
  }
  next();
}

// Obtener solo pacientes asignados a la psicopedagoga logueada
router.get('/mis-pacientes', verificarToken, soloUser, async (req, res) => {
  const nombrePsicopedagoga = req.usuario.nombre;
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.numero_paciente,
        p.nombre,
        p.apellido,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento)) AS edad,
        COALESCE(psico.nombre || ' ' || psico.apellido, p.psicopedagoga) AS psicopedagoga,
        COALESCE(sup.nombre || ' ' || sup.apellido, p.supervisora) AS supervisora,
        p.obra_social
      FROM pacientes p
      LEFT JOIN personas psico ON psico.nombre = p.psicopedagoga
      LEFT JOIN personas sup ON sup.nombre = p.supervisora
      WHERE p.psicopedagoga = $1
      ORDER BY p.numero_paciente
    `, [nombrePsicopedagoga]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ [GET /mis-pacientes] Error:", err);
    res.status(500).send('Error al obtener mis pacientes');
  }
});

// Obtener todos los pacientes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.numero_paciente,
        p.nombre,
        p.apellido,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento)) AS edad,
        COALESCE(psico.nombre || ' ' || psico.apellido, p.psicopedagoga) AS psicopedagoga,
        COALESCE(sup.nombre || ' ' || sup.apellido, p.supervisora) AS supervisora,
        p.obra_social
      FROM pacientes p
      LEFT JOIN personas psico ON psico.nombre = p.psicopedagoga
      LEFT JOIN personas sup ON sup.nombre = p.supervisora
      ORDER BY p.numero_paciente
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ [GET /] Error:", err);
    res.status(500).send('Error al obtener pacientes');
  }
});

// Obtener un paciente por ID
router.get('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.numero_paciente,
        p.nombre,
        p.apellido,
        p.dni,
        p.fecha_nacimiento,
        EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.fecha_nacimiento)) AS edad,
        COALESCE(psico.nombre || ' ' || psico.apellido, p.psicopedagoga) AS psicopedagoga,
        COALESCE(sup.nombre || ' ' || sup.apellido, p.supervisora) AS supervisora,
        p.obra_social
      FROM pacientes p
      LEFT JOIN personas psico ON psico.nombre = p.psicopedagoga
      LEFT JOIN personas sup ON sup.nombre = p.supervisora
      WHERE p.id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).send('Paciente no encontrado');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ [GET /:id] Error:", err);
    res.status(500).send('Error al obtener paciente por ID');
  }
});

// Crear paciente
router.post('/', async (req, res) => {
  const { numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, obra_social } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO pacientes 
      (numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, obra_social)
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, obra_social]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ [POST /] Error:", err);
    res.status(500).send('Error al crear paciente');
  }
});

// Editar paciente
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  const { numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, obra_social } = req.body;
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
      SET 
        numero_paciente=$1, 
        nombre=$2, 
        apellido=$3, 
        dni=$4, 
        fecha_nacimiento=$5, 
        psicopedagoga=$6, 
        supervisora=$7,
        obra_social=$8
      WHERE id=$9
    `, [numero_paciente, nombre, apellido, dni, fecha_nacimiento, psicopedagoga, supervisora, obra_social, id]);

    res.send('Paciente actualizado');
  } catch (err) {
    console.error("❌ [PUT /:id] Error:", err);
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
    console.error("❌ [DELETE /:id] Error:", err);
    res.status(500).send('Error al eliminar paciente');
  }
});

module.exports = router;
