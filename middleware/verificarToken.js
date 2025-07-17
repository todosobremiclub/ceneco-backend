const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'secreto'; // Debe coincidir con el usado en /login/admin y /login/usuario

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log("🔎 [verificarToken] Authorization header recibido:", authHeader);

  if (!authHeader) {
    console.log("❌ [verificarToken] Token no proporcionado");
    return res.status(401).send('Token no proporcionado');
  }

  const token = authHeader;  // Si estás enviando solo el token sin "Bearer"
  console.log("🔔 [verificarToken] Token a verificar:", token);

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      console.log("❌ [verificarToken] Token inválido:", err.message);
      return res.status(403).send('Token inválido');
    }

    console.log("✅ [verificarToken] Token válido, payload decodificado:", decoded);

    // ✅ Guardamos en req.usuario (en vez de req.user) para que funcione como espera pagosRoutes.js
    req.usuario = decoded;

    next();
  });
}

module.exports = verificarToken;
