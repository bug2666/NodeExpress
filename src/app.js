/* khi client dùng thì nó sẽ gọi request và app sẽ nhận và -> router quyết định đi đâu -> controller xử lý -> Trả kết quả */

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRouters');
const productRoutes = require('./routes/productRoutes');

const userRoutes = require('./routes/userRoutes');

const cartRoutes = require('./routes/cartRoutes');

const orderRoutes = require('./routes/orderRoutes');




const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);




module.exports = app;
