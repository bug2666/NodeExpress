process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

require('dotenv').config();
const app = require('./app');
const pool = require('./configs/mysql');

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
