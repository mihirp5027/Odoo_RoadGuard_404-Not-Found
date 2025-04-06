import { Request, Response } from 'express';
import User from '../models/User';
import ServiceRequest from '../models/ServiceRequest';
import { AuthRequest } from '../types/auth';

// Get user profile with current location
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update user's current location
export const updateUserLocation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Error updating user location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request a mechanic service
export const requestMechanic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const {
      vehicleId,
      serviceType,
      description,
      location,
    } = req.body;

    if (!vehicleId || !serviceType || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newRequest = new ServiceRequest({
      userId,
      vehicleId,
      serviceType,
      description,
      location: {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
        address: location.address
      },
      status: 'Pending'
    });

    await newRequest.save();

    // Populate the request with user and vehicle details
    const populatedRequest = await ServiceRequest.findById(newRequest._id)
      .populate('userId', 'name mobileNumber')
      .populate('vehicleId', 'make model year licensePlate');

    res.status(201).json({ request: populatedRequest });
  } catch (error) {
    console.error('Error creating service request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's service requests
export const getUserRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const requests = await ServiceRequest.find({ userId })
      .populate('userId', 'name mobileNumber')
      .populate('vehicleId', 'make model year licensePlate')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel a service request
export const cancelRequest = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { requestId } = req.params;

    const request = await ServiceRequest.findOne({ _id: requestId, userId });

    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (!['Pending', 'Accepted'].includes(request.status)) {
      return res.status(400).json({ 
        error: 'Cannot cancel request that is already in progress or completed' 
      });
    }

    request.status = 'Cancelled';
    await request.save();

    res.json({ message: 'Request cancelled successfully', request });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 