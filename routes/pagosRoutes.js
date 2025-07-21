const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/verificarToken');

// ✅ GET /api/pagos → Listar pagos
router.get('/', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pagos.id, pagos.fecha, pagos.monto_total, pagos.monto_supervisora, pagos.dias_evaluados, pagos.cantidad_sesiones,
             pagos.obra_social, pagos.tipo_sesion,
             pacientes.nombre || ' ' || pacientes.apellido as paciente_nombre
      FROM pagos
      JOIN pacientes ON pagos.paciente_id = pacientes.id
      ORDER BY pagos.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    res.status(500).send('Error al obtener pagos');
  }
});

// ✅ POST /api/pagos → Guardar pago
router.post('/', verificarToken, async (req, res) => {
  const { paciente_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion } = req.body;
  const psicopedagogaId = req.usuario.id;

  console.log('📥 Payload recibido en POST /api/pagos:', {
    paciente_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion
  });

  try {
    await pool.query(
      `INSERT INTO pagos 
       (paciente_id, psicopedagoga_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [paciente_id, psicopedagogaId, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// ✅ DELETE /api/pagos/:id → Eliminar pago
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM pagos WHERE id = $1', [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error('Error al eliminar pago:', err);
    res.status(500).send('Error al eliminar pago');
  }
});

module.exports = router;
