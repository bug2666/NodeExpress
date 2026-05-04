const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const test = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM users LIMIT 2');
    console.log('ROWS:', rows);


    const hashed = await bcrypt.hash('123456', 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      ['Test User', `test_${Date.now()}@gmail.com`, hashed]
    );
    console.log('RESULT:', result);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
};

test();
