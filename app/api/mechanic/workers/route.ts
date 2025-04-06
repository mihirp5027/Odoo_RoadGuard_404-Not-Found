import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Worker from '@/models/Worker';
import { verifyJWT } from '@/lib/jwt';

// GET /api/mechanic/workers - Get all workers for a mechanic
export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.mechanicId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await connectDB();

    const workers = await Worker.find({ mechanicId: decoded.mechanicId })
      .select('-__v')
      .populate('currentTask', 'serviceType status location vehicleId')
      .sort({ createdAt: -1 });

    return NextResponse.json({ workers });
  } catch (error) {
    console.error('Error fetching workers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/mechanic/workers - Add a new worker
export async function POST(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.mechanicId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, mobileNumber } = await req.json();

    if (!name || !mobileNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Check if worker with mobile number already exists
    const existingWorker = await Worker.findOne({ mobileNumber });
    if (existingWorker) {
      return NextResponse.json({ error: 'Worker with this mobile number already exists' }, { status: 400 });
    }

    const worker = await Worker.create({
      name,
      mobileNumber,
      mechanicId: decoded.mechanicId,
    });

    return NextResponse.json({ worker }, { status: 201 });
  } catch (error) {
    console.error('Error creating worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/mechanic/workers/:id - Update worker status
export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.mechanicId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = req.params;
    const { isActive, currentStatus } = await req.json();

    await connectDB();

    const worker = await Worker.findOne({ _id: id, mechanicId: decoded.mechanicId });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    if (typeof isActive === 'boolean') {
      worker.isActive = isActive;
    }

    if (currentStatus) {
      worker.currentStatus = currentStatus;
    }

    worker.lastActive = new Date();
    await worker.save();

    return NextResponse.json({ worker });
  } catch (error) {
    console.error('Error updating worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/mechanic/workers/:id - Delete a worker
export async function DELETE(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.mechanicId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = req.params;

    await connectDB();

    const worker = await Worker.findOneAndDelete({ _id: id, mechanicId: decoded.mechanicId });
    if (!worker) {
      return NextResponse.json({ error: 'Worker not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 