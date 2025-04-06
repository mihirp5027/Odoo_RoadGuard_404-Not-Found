import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Worker from '@/models/Worker';
import ServiceRequest from '@/models/ServiceRequest';
import { verifyJWT } from '@/lib/jwt';

// POST /api/mechanic/assign-worker - Assign a service request to a worker
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

    const { workerId, requestId } = await req.json();

    if (!workerId || !requestId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Check if worker exists and belongs to the mechanic
    const worker = await Worker.findOne({ 
      _id: workerId, 
      mechanicId: decoded.mechanicId,
      isActive: true 
    });

    if (!worker) {
      return NextResponse.json({ error: 'Worker not found or inactive' }, { status: 404 });
    }

    // Check if worker is available
    if (worker.currentStatus !== 'available') {
      return NextResponse.json({ error: 'Worker is not available' }, { status: 400 });
    }

    // Check if service request exists and belongs to the mechanic
    const request = await ServiceRequest.findOne({ 
      _id: requestId, 
      mechanicId: decoded.mechanicId,
      status: 'Pending' 
    });

    if (!request) {
      return NextResponse.json({ error: 'Service request not found or not pending' }, { status: 404 });
    }

    // Update worker status and assign task
    worker.currentStatus = 'working';
    worker.currentTask = requestId;
    await worker.save();

    // Update service request status and assign worker
    request.status = 'Assigned';
    request.assignedWorker = workerId;
    await request.save();

    return NextResponse.json({ 
      message: 'Task assigned successfully',
      worker,
      request 
    });
  } catch (error) {
    console.error('Error assigning worker:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/mechanic/assign-worker/:requestId/complete - Mark a task as completed
export async function PUT(req: Request) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.workerId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { requestId } = req.params;

    await connectDB();

    // Find the worker and their current task
    const worker = await Worker.findById(decoded.workerId);
    if (!worker || !worker.currentTask || worker.currentTask.toString() !== requestId) {
      return NextResponse.json({ error: 'Unauthorized or invalid task' }, { status: 401 });
    }

    // Update the service request
    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    request.status = 'Completed';
    await request.save();

    // Update worker status
    worker.currentStatus = 'available';
    worker.currentTask = null;
    worker.completedTasks.push(requestId);
    await worker.save();

    return NextResponse.json({ 
      message: 'Task marked as completed',
      worker,
      request 
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 