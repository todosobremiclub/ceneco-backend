const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/verificarToken');

// Middleware soloUser (para psicopedagogas)
function soloUser(req, res, next) {
  console.log("🔎 [soloUser] req.user recibido:", req.user);
  if (req.user.perfil !== 'usuario') {
    console.log("❌ [soloUser] perfil no autorizado:", req.user.perfil);
    return res.status(403).send('Acceso permitido solo a psicopedagogas');
  }
  console.log("✅ [soloUser] acceso permitido a psicopedagoga");
  next();
}

// ✅ Obtener solo pacientes asignados a la psicopedagoga logueada (primero!)
router.get('/mis-pacientes', verificarToken, soloUser, async (req, res) => {
  console.log("📥 [GET /mis-pacientes] Iniciando para usuario:", req.user);

  const nombrePsicopedagoga = req.user.nombre;
  console.log("🔔 [GET /mis-pacientes] nombrePsicopedagoga =", nombrePsicopedagoga);

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
      WHERE psicopedagoga = $1
      ORDER BY numero_paciente
    `, [nombrePsicopedagoga]);

    console.log(`✅ [GET /mis-pacientes] Pacientes encontrados: ${result.rowCount}`);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ [GET /mis-pacientes] Error:", err);
    res.status(500).send('Error al obtener mis pacientes');
  }
});

// Obtener un paciente por ID (después!)
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
    console.error("❌ [GET /:id] Error:", err);
    res.status(500).send('Error al obtener paciente por ID');
  }
});

// Obtener todos los pacientes
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
    console.error("❌ [GET /] Error:", err);
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
    console.error("❌ [POST /] Error:", err);
    res.status(500).send('Error al crear paciente');
  }
});

// Editar paciente
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
