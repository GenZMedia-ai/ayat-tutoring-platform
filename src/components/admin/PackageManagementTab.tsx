
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus } from 'lucide-react';
import { usePackageManagement } from '@/hooks/usePackageManagement';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export const PackageManagementTab: React.FC = () => {
  const { packages, loading, createPackage, updatePackage, deletePackage } = usePackageManagement();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    session_count: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const packageData = {
      name: formData.name,
      description: formData.description,
      price: parseInt(formData.price),
      session_count: parseInt(formData.session_count),
      is_active: true
    };

    try {
      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
        setEditingPackage(null);
      } else {
        await createPackage(packageData);
        setIsCreateModalOpen(false);
      }
      
      setFormData({ name: '', description: '', price: '', session_count: '' });
    } catch (error) {
      console.error('Error saving package:', error);
    }
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      session_count: pkg.session_count.toString()
    });
  };

  const handleToggleActive = async (pkg: any) => {
    await updatePackage(pkg.id, { is_active: !pkg.is_active });
  };

  const PackageForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Package Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 8 Session Package"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="session_count">Session Count</Label>
        <Input
          id="session_count"
          type="number"
          value={formData.session_count}
          onChange={(e) => setFormData({ ...formData, session_count: e.target.value })}
          placeholder="8"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Base Price (Currency Neutral)</Label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="200"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Package description"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        {editingPackage ? 'Update Package' : 'Create Package'}
      </Button>
    </form>
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading packages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Package Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage learning packages</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Package</DialogTitle>
              <DialogDescription>
                Create a new learning package that sales agents can offer to customers.
              </DialogDescription>
            </DialogHeader>
            <PackageForm />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{pkg.name}</h4>
                    <Badge variant={pkg.is_active ? "default" : "secondary"}>
                      {pkg.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pkg.description}</p>
                  <div className="flex gap-4 text-sm">
                    <span><strong>{pkg.session_count}</strong> sessions</span>
                    <span>Base Price: <strong>{pkg.price}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={() => handleToggleActive(pkg)}
                    />
                    <Label className="text-sm">Active</Label>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(pkg)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deletePackage(pkg.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {packages.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No packages created yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first package to get started.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {editingPackage && (
        <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Package</DialogTitle>
              <DialogDescription>
                Update the package details.
              </DialogDescription>
            </DialogHeader>
            <PackageForm />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
