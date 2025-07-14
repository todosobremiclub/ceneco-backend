const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const admin = require('../firebase');

const upload = multer({ storage: multer.memoryStorage() });

// Obtener historia clínica por numero_paciente
router.get('/:numero_paciente', async (req, res) => {
  const { numero_paciente } = req.params;
  try {
    const result = await pool.query(
      `SELECT fecha, tipo, contenido, archivo
       FROM historia_clinica
       WHERE paciente_id = $1
       ORDER BY fecha ASC`,
      [numero_paciente]
    );

    // 🔔 Generar signed URLs dinámicamente
    const registros = await Promise.all(result.rows.map(async r => {
      let adjunto = null;
      if (r.archivo) {
        try {
          const file = admin.storage().bucket().file(r.archivo);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000 // 1 hora
          });
          adjunto = signedUrl;
        } catch (err) {
          console.error('Error generando signed URL:', err);
        }
      }
      return {
        fecha: r.fecha,
        tipo: r.tipo,
        contenido: r.contenido,
        adjunto
      };
    }));

    res.json(registros);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener historia clínica');
  }
});

// Guardar texto simple
router.post('/', async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  try {
    await pool.query(
      `INSERT INTO historia_clinica (paciente_id, tipo, contenido, fecha)
       VALUES ($1, $2, $3, NOW())`,
      [paciente_id, tipo, contenido]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar registro en historia clínica');
  }
});

// Guardar con archivo (subir a Firebase Storage)
router.post('/documento', upload.single('archivo'), async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;

  if (!req.file) {
    return res.status(400).send('Archivo no recibido');
  }

  try {
    const bucket = admin.storage().bucket();
    const filename = `historia/${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype }
    });

    stream.on('error', err => {
      console.error('Error al subir a Firebase:', err);
      res.status(500).send('Error al subir archivo');
    });

    stream.on('finish', async () => {
      try {
        // Guardamos solo el `filename` (path relativo) en la DB
        await pool.query(
          `INSERT INTO historia_clinica (paciente_id, tipo, contenido, archivo, fecha)
           VALUES ($1, $2, $3, $4, NOW())`,
          [paciente_id, tipo, contenido, filename]
        );
        res.sendStatus(200);
      } catch (err) {
        console.error('Error al guardar en DB:', err);
        res.status(500).send('Error al guardar registro en historia clínica');
      }
    });

    stream.end(req.file.buffer);

  } catch (err) {
    console.error(err);
    res.status(500).send('Error inesperado al procesar archivo');
  }
});

module.exports = router;

