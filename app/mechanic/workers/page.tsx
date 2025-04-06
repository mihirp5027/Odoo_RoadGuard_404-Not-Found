"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { User, Phone, Plus, X, CheckCircle, XCircle } from "lucide-react";

interface Worker {
  _id: string;
  name: string;
  mobileNumber: string;
  isActive: boolean;
  currentStatus: 'available' | 'working' | 'offline';
  currentTask: any;
  completedTasks: string[];
  lastActive: string;
}

export default function WorkersPage() {
  const { toast } = useToast();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newWorker, setNewWorker] = useState({ name: '', mobileNumber: '' });

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/mechanic/workers', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch workers');
      }

      const data = await response.json();
      setWorkers(data.workers);
    } catch (error) {
      console.error('Error fetching workers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch workers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWorker = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/mechanic/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newWorker),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add worker');
      }

      const data = await response.json();
      setWorkers([...workers, data.worker]);
      setIsAddDialogOpen(false);
      setNewWorker({ name: '', mobileNumber: '' });
      
      toast({
        title: "Success",
        description: "Worker added successfully.",
      });
    } catch (error) {
      console.error('Error adding worker:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add worker. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleWorkerStatus = async (workerId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`http://localhost:5000/api/mechanic/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update worker status');
      }

      const data = await response.json();
      setWorkers(workers.map(w => w._id === workerId ? data.worker : w));
      
      toast({
        title: "Success",
        description: `Worker ${isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating worker status:', error);
      toast({
        title: "Error",
        description: "Failed to update worker status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'working':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      case 'offline':
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="container px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workers Management</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Worker
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker._id} className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary dark:text-primary/90" />
                  </div>
                  <div className="ml-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{worker.name}</h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Phone className="w-4 h-4 mr-1" />
                      {worker.mobileNumber}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleWorkerStatus(worker._id, !worker.isActive)}
                >
                  {worker.isActive ? (
                    <XCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(worker.currentStatus)}`}>
                    {worker.currentStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Completed Tasks</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {worker.completedTasks.length}
                  </span>
                </div>
                {worker.currentTask && (
                  <div className="mt-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Current Task</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {worker.currentTask.serviceType}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                placeholder="Enter worker name"
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={newWorker.mobileNumber}
                onChange={(e) => setNewWorker({ ...newWorker, mobileNumber: e.target.value })}
                placeholder="Enter mobile number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWorker}>Add Worker</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 