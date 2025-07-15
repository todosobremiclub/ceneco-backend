const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY || 'secreto'; // Debe coincidir con el usado en /login/admin y /login/usuario

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).send('Token no proporcionado');
  }

  const token = authHeader;  // Si estás enviando solo el token sin el prefijo "Bearer"

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).send('Token inválido');
    }

    // Guardamos el payload decodificado en req.user
    req.user = decoded;

    /*
      Ejemplo de contenido en decoded esperado:
      {
        dni: '12345678',
        numero: '0001',
        perfil: 'usuario' // o 'admin'
        iat: ...,
        exp: ...
      }
    */

    next();
  });
}

module.exports = verificarToken;
