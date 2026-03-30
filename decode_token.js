const jwt = require('jsonwebtoken');
const token = process.argv[2];
if (!token) {
  console.log('Usage: node decode_token.js <token>');
  process.exit(1);
}
try {
  const decoded = jwt.decode(token);
  console.log('Decoded token:', JSON.stringify(decoded, null, 2));
} catch (err) {
  console.log('Error decoding token:', err.message);
}
