const pool = require('../configs/mysql'); // thư viện dùng để thao tác với DB

//đặt luật cho dữ liệu đầu vào của người dùng để lưu vào DB

const findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password, phone, role FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0] || null;
};
/* rows chỉ có sau câu SELECT */

const findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT id, name, email, phone, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
};

const createUser = async ({ name, email, password, phone, role = 'user' }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
    [name, email, password, phone || null, role]
  );

  return findById(result.insertId);
};


const updateProfileById = async (id, { name, phone }) => {
  const [result] = await pool.execute(
    'UPDATE users SET name = ?, phone = ? WHERE id = ?',
    [name, phone || null, id]
  );
  if (result.affectedRows === 0) return null;
  return findById(id);
};

/* reset pass */
const saveResetToken = async (userId, token, expiresAt) => {
  await pool.execute(
    `UPDATE users
         SET reset_password_token = ?, reset_password_expires = ?
         WHERE id = ?`,
    [token, expiresAt, userId]
  );
};

const findByResetToken = async (token) => {
  const [rows] = await pool.execute(
    `SELECT id, name, email, reset_password_expires AS resetPasswordExpires
         FROM users
         WHERE reset_password_token = ?
         LIMIT 1`,
    [token]
  );

  return rows[0] || null;
};

const updatePassword = async (userId, hashedPassword) => {
  await pool.execute(
    `UPDATE users
         SET password = ?
         WHERE id = ?`,
    [hashedPassword, userId]
  );
};

const clearResetToken = async (userId) => {
  await pool.execute(
    `UPDATE users
         SET reset_password_token = NULL,
             reset_password_expires = NULL
         WHERE id = ?`,
    [userId]
  );
};


/* result chỉ có sau câu INSERT */
module.exports = {
  findByEmail,
  findById,
  createUser,
  updateProfileById,
  saveResetToken,
  findByResetToken,
  updatePassword,
  clearResetToken
};
/*xuất module này để dùng lại */