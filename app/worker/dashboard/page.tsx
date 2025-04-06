"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  User,
  Car,
  CheckCircle,
  LogOut,
  Clock,
  RefreshCcw,
  X
} from "lucide-react";

interface ServiceRequest {
  _id: string;
  userId: {
    name: string;
    mobileNumber: string;
  };
  vehicleId: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  };
  serviceType: string;
  description: string;
  location: {
    coordinates: [number, number];
    address: string;
  };
  status: string;
  createdAt: string;
}

interface Worker {
  _id: string;
  name: string;
  mobileNumber: string;
  currentStatus: string;
  currentTask: ServiceRequest | null;
}

export default function WorkerDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('workerToken');

    if (!token) {
      router.push('/auth/worker/login');
      return;
    }

    // Fetch worker data from API
    fetchWorkerData();
    fetchCurrentTask();
    fetchAssignedTasks();
  }, []);

  const fetchWorkerData = async () => {
    try {
      const token = localStorage.getItem('workerToken');
      if (!token) {
        router.push('/auth/worker/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/worker/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('workerToken');
          router.push('/auth/worker/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch worker data');
      }

      const data = await response.json();
      setWorker(data.worker);
    } catch (error) {
      console.error('Error fetching worker data:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch worker data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentTask = async () => {
    try {
      const token = localStorage.getItem('workerToken');
      if (!token) {
        router.push('/auth/worker/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/worker/current-task', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('workerToken');
          router.push('/auth/worker/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch current task');
      }

      const data = await response.json();
      setWorker(prev => prev ? { ...prev, currentTask: data.task } : null);
    } catch (error) {
      console.error('Error fetching task:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch your current task.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignedTasks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('workerToken');
      if (!token) {
        router.push('/auth/worker/login');
        return;
      }

      const response = await fetch('http://localhost:5000/api/worker/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('workerToken');
          router.push('/auth/worker/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const data = await response.json();
      setAssignedTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to load tasks');
      setAssignedTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('workerToken');
      if (!token) {
        setError('Please login to complete tasks');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/worker/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('workerToken');
          router.push('/auth/worker/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }

      // Refresh tasks after completing one
      await fetchCurrentTask();
      await fetchAssignedTasks();
      
      toast({
        title: "Success",
        description: "Task marked as completed successfully.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete task');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to complete task",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('workerToken');
    router.push('/auth/worker/login');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Worker Dashboard</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Worker Profile Card */}
      {worker && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Worker Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{worker.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Mobile Number</p>
                <p className="font-medium">{worker.mobileNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={worker.currentStatus === 'available' ? 'default' : 'secondary'}>
                  {worker.currentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Task Card */}
      {worker?.currentTask && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Current Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{worker.currentTask.userId.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{worker.currentTask.userId.mobileNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">
                    {worker.currentTask.vehicleId.make} {worker.currentTask.vehicleId.model} ({worker.currentTask.vehicleId.year})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Plate</p>
                  <p className="font-medium">{worker.currentTask.vehicleId.licensePlate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service Type</p>
                  <p className="font-medium">{worker.currentTask.serviceType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge>{worker.currentTask.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {worker.currentTask.location.address}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="font-medium">{worker.currentTask.description}</p>
              </div>
              <Button 
                className="w-full"
                onClick={() => handleCompleteTask(worker.currentTask._id)}
                disabled={isLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Completed Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : assignedTasks.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No completed tasks yet</div>
          ) : (
            <div className="space-y-4">
              {assignedTasks.map((task) => (
                <Card key={task._id}>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">{task.userId.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Vehicle</p>
                        <p className="font-medium">
                          {task.vehicleId.make} {task.vehicleId.model}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Service Type</p>
                        <p className="font-medium">{task.serviceType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Completed At</p>
                        <p className="font-medium">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 