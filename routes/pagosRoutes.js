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
       pacientes.nombre || ' ' || pacientes.apellido as paciente_nombre,
       personas.nombre || ' ' || personas.apellido as supervisora
FROM pagos
JOIN pacientes ON pagos.paciente_id = pacientes.id
LEFT JOIN personas ON personas.nombre = pacientes.supervisora
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
  const { paciente_id, dias_evaluados, cantidad_sesiones, obra_social, tipo_sesion, monto_sesion } = req.body;
  const psicopedagogaId = req.usuario.id;

  // 🔔 Cálculos seguros en backend:
  const sesiones = parseInt(cantidad_sesiones) || 0;
  const montoUnitario = parseFloat(monto_sesion) || 0;
  const monto_total = montoUnitario * sesiones;
  const monto_supervisora = monto_total * 0.3;

  console.log('📝 Registrando pago con: ', {
    paciente_id, psicopedagogaId, dias_evaluados, sesiones, montoUnitario, monto_total, monto_supervisora, obra_social, tipo_sesion
  });

  try {
    await pool.query(
      `INSERT INTO pagos 
       (paciente_id, psicopedagoga_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [paciente_id, psicopedagogaId, dias_evaluados, sesiones, monto_total, monto_supervisora, obra_social, tipo_sesion]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al registrar pago:', err);
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
