import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from 'react-router-dom';

// Dummy project types
const projectTypes = [
  'Construction',
  'Renovation',
  'Maintenance',
  'Installation',
  'Repair',
  'Upgrade',
  'New Build'
];

// Dummy statuses
const statuses = [
  'Active',
  'Completed',
  'On Hold',
  'Cancelled',
  'Planning',
  'In Progress'
];

export function GenesisProjectUsageForm() {
  const navigate = useNavigate();
  const { id, action } = useParams();
  const isEditMode = action === 'edit';
  const isViewMode = action === 'view';

  const [formData, setFormData] = useState({
    // Basic Information
    projectCode: '',
    projectName: '',
    projectType: '',
    startDate: '',
    endDate: '',
    priority: 'Medium',
    notes: '',
    
    // Usage Details
    itemsUsed: 0,
    totalCost: 0,
    budget: 0,
    costCenter: '',
    usageNotes: '',
    
    // Additional Information
    projectManager: '',
    department: '',
    location: '',
    status: 'Active',
    specialInstructions: ''
  });

  useEffect(() => {
    if (isEditMode || isViewMode) {
      // Load existing data for editing/viewing
      setFormData({
        projectCode: `PRJ-${id?.padStart(6, '0')}`,
        projectName: 'Office Building Renovation',
        projectType: 'Renovation',
        startDate: '2024-01-15',
        endDate: '2024-06-30',
        priority: 'High',
        notes: 'Complete renovation of the main office building including electrical and plumbing upgrades.',
        itemsUsed: 45,
        totalCost: 125000.00,
        budget: 150000.00,
        costCenter: 'CC-001',
        usageNotes: 'All materials used according to specifications. No wastage reported.',
        projectManager: 'Mike Johnson',
        department: 'Facilities',
        location: 'Main Office Building',
        status: 'Active',
        specialInstructions: 'Ensure all safety protocols are followed during renovation.'
      });
    } else {
      // Set default values for new project usage
      const nextProjectCode = `PRJ-${String(Math.floor(Math.random() * 999999) + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, projectCode: nextProjectCode }));
    }
  }, [isEditMode, isViewMode, id]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Here you would typically save to backend
    console.log('Saving project usage:', formData);
    navigate('/procurement/genesis');
  };

  const handleCancel = () => {
    navigate('/procurement/genesis');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isViewMode ? 'View Project Usage' : isEditMode ? 'Edit Project Usage' : 'Create Project Usage'}
            </h1>
            <p className="text-gray-600">
              {isViewMode ? 'View project usage details' : isEditMode ? 'Update project usage details' : 'Create a new project usage record'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectCode">Project Code</Label>
                <Input
                  id="projectCode"
                  value={formData.projectCode}
                  onChange={(e) => handleInputChange('projectCode', e.target.value)}
                  placeholder="Enter project code"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => handleInputChange('projectName', e.target.value)}
                  placeholder="Enter project name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter project notes"
                disabled={isViewMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemsUsed">Items Used</Label>
                <Input
                  id="itemsUsed"
                  type="number"
                  min="0"
                  value={formData.itemsUsed}
                  onChange={(e) => handleInputChange('itemsUsed', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCost">Total Cost</Label>
                <Input
                  id="totalCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalCost}
                  onChange={(e) => handleInputChange('totalCost', parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget</Label>
                <Input
                  id="budget"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => handleInputChange('budget', parseFloat(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costCenter">Cost Center</Label>
                <Input
                  id="costCenter"
                  value={formData.costCenter}
                  onChange={(e) => handleInputChange('costCenter', e.target.value)}
                  placeholder="Enter cost center"
                  disabled={isViewMode}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usageNotes">Usage Notes</Label>
              <Input
                id="usageNotes"
                value={formData.usageNotes}
                onChange={(e) => handleInputChange('usageNotes', e.target.value)}
                placeholder="Enter usage notes"
                disabled={isViewMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information Section */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectManager">Project Manager</Label>
                <Input
                  id="projectManager"
                  value={formData.projectManager}
                  onChange={(e) => handleInputChange('projectManager', e.target.value)}
                  placeholder="Enter project manager name"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  placeholder="Enter department"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter project location"
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)} disabled={isViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Input
                id="specialInstructions"
                value={formData.specialInstructions}
                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                placeholder="Enter special instructions"
                disabled={isViewMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Footer */}
      <div className="border-t bg-white p-6">
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave}>
              {isEditMode ? 'Update Project Usage' : 'Save Project Usage'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 