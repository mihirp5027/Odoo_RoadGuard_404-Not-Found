import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import workerAuthRoutes from './routes/workerAuthRoutes';
import mechanicRoutes from './routes/mechanicRoutes';
import serviceRequestRoutes from './routes/serviceRequestRoutes';
import workerRoutes from './routes/workerRoutes';
import userServiceRoutes from './routes/userServiceRoutes';
import { connectDB } from './lib/db';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/worker', workerAuthRoutes);
app.use('/api/mechanic', mechanicRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/worker', workerRoutes);
app.use('/api/user/services', userServiceRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

export default app; 