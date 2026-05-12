process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

import dotenv from 'dotenv';
import app from './app.js';
import pool from './configs/mysql.js';

dotenv.config();


const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await pool.execute('SELECT 1');
    console.log('MySQL connected');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MySQL connection failed:', error);
    process.exit(1);
  }
};

startServer();
