/* khi client dùng thì nó sẽ gọi request và app sẽ nhận và -> router quyết định đi đâu -> controller xử lý -> Trả kết quả */

import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRouters.js';


import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';


const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);


export default app;

