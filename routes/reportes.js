const express = require('express');
const router = express.Router();
const pool = require('../db');
const verificarToken = require('../middleware/verificarToken');

router.get('/supervisoras', verificarToken, async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        TO_CHAR(p.fecha, 'YYYY-MM') AS mes,
        pa.supervisora,
        SUM(p.monto_supervisora) AS monto
      FROM pagos p
      JOIN pacientes pa ON p.paciente_id = pa.id
      WHERE pa.supervisora IS NOT NULL
      GROUP BY mes, pa.supervisora
      ORDER BY mes DESC, pa.supervisora;
    `);
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener reporte de supervisoras:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

