const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'secreto'; // Asegurate que sea el mismo que usás en authRoutes.js

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).send('Token no proporcionado');
  }

  const token = authHeader;

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send('Token inválido');
    }
    req.user = decoded; // Aquí tendrás disponible req.user.tipo, req.user.nombre, req.user.id
    next();
  });
}

module.exports = verificarToken;
