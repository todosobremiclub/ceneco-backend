const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const admin = require('../firebase');
const verificarToken = require('../middleware/verificarToken');

const upload = multer({ storage: multer.memoryStorage() });

// Obtener historia clínica por numero_paciente
router.get('/:numero_paciente', verificarToken, async (req, res) => {
  const { numero_paciente } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, fecha, tipo, contenido, archivo, autor, autor_nombre
       FROM historia_clinica
       WHERE paciente_id = $1
       ORDER BY fecha ASC`,
      [numero_paciente]
    );

    const registros = await Promise.all(result.rows.map(async r => {
      let adjunto = null;
      if (r.archivo) {
        try {
          const file = admin.storage().bucket().file(r.archivo);
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000
          });
          adjunto = signedUrl;
        } catch (err) {
          console.error('Error generando signed URL:', err);
        }
      }
      return {
        id: r.id,
        fecha: r.fecha,
        tipo: r.tipo,
        contenido: r.contenido,
        adjunto,
        autor: r.autor,
        autor_nombre: r.autor_nombre
      };
    }));

    res.json(registros);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener historia clínica');
  }
});

// Guardar texto simple
router.post('/', verificarToken, async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  cconst autor = req.usuario.perfil;
const autor_nombre = req.usuario.nombre;


  try {
    await pool.query(
      `INSERT INTO historia_clinica (paciente_id, tipo, contenido, fecha, autor, autor_nombre)
       VALUES ($1, $2, $3, NOW(), $4, $5)`,
      [paciente_id, tipo, contenido, autor, autor_nombre]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar registro en historia clínica');
  }
});

// Guardar con archivo
router.post('/documento', verificarToken, upload.single('archivo'), async (req, res) => {
  const { paciente_id, tipo, contenido } = req.body;
  const autor = req.usuario.perfil;
  const autor_nombre = req.usuario.nombre;

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
        await pool.query(
          `INSERT INTO historia_clinica (paciente_id, tipo, contenido, archivo, fecha, autor, autor_nombre)
           VALUES ($1, $2, $3, $4, NOW(), $5, $6)`,
          [paciente_id, tipo, contenido, filename, autor, autor_nombre]
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

// Eliminar registro
router.delete('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM historia_clinica WHERE id = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar registro');
  }
});

// Editar registro
router.put('/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { tipo, contenido } = req.body;
  try {
    await pool.query(
      `UPDATE historia_clinica
       SET tipo = $1, contenido = $2
       WHERE id = $3`,
      [tipo, contenido, id]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar registro');
  }
});

// Limpiar historia completa
router.post('/limpiar', verificarToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM historia_clinica');
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al limpiar historia clínica');
  }
});

module.exports = router;
