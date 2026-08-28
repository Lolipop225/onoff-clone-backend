// db.js
// MVP : stockage en mémoire pour aller vite en vibe coding.
// ⚠️ À remplacer par PostgreSQL (Prisma ou Knex) avant tout usage réel :
// les données sont perdues à chaque redémarrage du serveur.

const users = new Map();     // id -> { id, email, passwordHash, createdAt }
const numbers = new Map();   // id -> { id, userId, twilioSid, phoneNumber, status, createdAt }
const messages = [];         // { id, numberId, from, to, body, direction, createdAt }
const payments = new Map();  // transactionId -> { userId, amount, status, provider }

let nextId = 1;
function genId() {
  return String(nextId++);
}

module.exports = { users, numbers, messages, payments, genId };
