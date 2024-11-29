import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/router.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', verifyToken, taskRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

