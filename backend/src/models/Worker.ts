import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
  },
  mechanicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mechanic',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  currentStatus: {
    type: String,
    enum: ['available', 'working', 'offline'],
    default: 'available',
  },
  currentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MechanicRequest',
    default: null,
  },
  completedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MechanicRequest',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
});

const Worker = mongoose.models.Worker || mongoose.model('Worker', workerSchema);

export default Worker; 