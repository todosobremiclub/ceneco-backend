const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error('Falta definir FIREBASE_SERVICE_ACCOUNT');
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 🔧 Corregir saltos de línea en la private_key
if (serviceAccount.private_key) {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'ceneco-7aa23.firebasestorage.app'  // 🔔 Cambiar por tu bucket real
});

module.exports = admin;
