const express = require('express');
const router = express.Router();
const pool = require('../db'); // asegúrate que `pool` apunta a tu conexión Postgres
const verificarToken = require('../middleware/verificarToken');


// Endpoint POST para registrar pagos
router.post('/', verificarToken, async (req, res) => {
  const { paciente_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora } = req.body;
  const psicopedagogaId = req.usuario.id; // asegúrate que `req.usuario` trae datos correctos

  try {
    await pool.query(
      `INSERT INTO pagos 
       (paciente_id, psicopedagoga_id, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [paciente_id, psicopedagogaId, dias_evaluados, cantidad_sesiones, monto_total, monto_supervisora]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el pago' });
  }
});

// Si querés agregar más rutas de pagos (como listados, reportes, etc), van acá también.

module.exports = router;
