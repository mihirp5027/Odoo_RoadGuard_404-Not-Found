import express from 'express';
import { sendOTP, verifyOTP } from '../controllers/authController';
import Worker from '../models/Worker';

const router = express.Router();

// Debug middleware
router.use((req, res, next) => {
  console.log(`Worker Auth Route: ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Send OTP for worker login
router.post('/otp/send', async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    // Check if worker exists
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found. Please contact your mechanic to register.' });
    }

    // Call the existing sendOTP function
    await sendOTP(req, res);
  } catch (error) {
    console.error('Error in worker OTP send:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to send OTP',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Verify OTP for worker login
router.post('/otp/verify', async (req, res) => {
  try {
    const { mobileNumber, otp } = req.body;

    // Check if worker exists
    const worker = await Worker.findOne({ mobileNumber });
    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Call the existing verifyOTP function
    await verifyOTP(req, res);
  } catch (error) {
    console.error('Error in worker OTP verify:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to verify OTP',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

export default router; 