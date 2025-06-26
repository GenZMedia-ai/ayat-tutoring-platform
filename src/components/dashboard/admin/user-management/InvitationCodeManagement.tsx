
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Copy, Eye, Trash2, ChevronDown, Calendar, Users, RefreshCw } from 'lucide-react';
import { useEnhancedInvitationCodes } from '@/hooks/useEnhancedInvitationCodes';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const InvitationCodeManagement: React.FC = () => {
  const { data: codes, isLoading, createCode, deactivateCode, deleteCode } = useEnhancedInvitationCodes();
  const [isCreating, setIsCreating] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  
  const [newCode, setNewCode] = useState({
    role: 'teacher',
    teacherType: 'kids',
    codeName: '',
    expiresAt: '',
    usageLimit: 5
  });

  const handleCreateCode = async () => {
    if (!newCode.codeName || !newCode.expiresAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    try {
      await createCode({
        code: newCode.codeName.toUpperCase(),
        role: newCode.role as any,
        expiresAt: newCode.expiresAt,
        usageLimit: newCode.usageLimit,
        teacherType: newCode.role === 'teacher' ? newCode.teacherType : undefined
      });
      
      setNewCode({
        role: 'teacher',
        teacherType: 'kids',
        codeName: '',
        expiresAt: '',
        usageLimit: 5
      });
      
      toast.success('Invitation code created successfully');
    } catch (error) {
      toast.error('Failed to create invitation code');
    } finally {
      setIsCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const getStatusBadge = (code: any) => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    const isExpired = expiresAt < now;
    const isExhausted = code.used_count >= code.usage_limit;

    if (isExpired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (isExhausted) {
      return <Badge variant="secondary">Exhausted</Badge>;
    }
    if (!code.is_active) {
      return <Badge variant="outline">Deactivated</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getUsageBadge = (code: any) => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    const isExpired = expiresAt < now;
    const isExhausted = code.used_count >= code.usage_limit;
    
    let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
    
    if (isExpired || isExhausted) {
      variant = "destructive";
    } else if (code.used_count > 0) {
      variant = "secondary";
    }

    return (
      <Badge variant={variant} className="font-mono">
        {code.used_count}/{code.usage_limit}
      </Badge>
    );
  };

  const activeCodes = codes?.filter(code => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    return code.is_active && expiresAt > now && code.used_count < code.usage_limit;
  }) || [];

  const expiredCodes = codes?.filter(code => {
    const now = new Date();
    const expiresAt = new Date(code.expires_at);
    return !code.is_active || expiresAt <= now || code.used_count >= code.usage_limit;
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Invitation Code
          </CardTitle>
          <CardDescription>
            Generate invitation codes for new users to register with specific roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newCode.role}
                onChange={(e) => setNewCode({ ...newCode, role: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="teacher">Teacher</option>
                <option value="sales">Sales Agent</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>

            {newCode.role === 'teacher' && (
              <div>
                <Label htmlFor="teacherType">Teacher Type</Label>
                <select
                  id="teacherType"
                  value={newCode.teacherType}
                  onChange={(e) => setNewCode({ ...newCode, teacherType: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="kids">Kids</option>
                  <option value="adult">Adult</option>
                  <option value="mixed">Mixed</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="codeName">Code Name</Label>
              <Input
                id="codeName"
                value={newCode.codeName}
                onChange={(e) => setNewCode({ ...newCode, codeName: e.target.value })}
                placeholder="TEACH2025A"
                className="uppercase"
              />
            </div>

            <div>
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={newCode.expiresAt}
                onChange={(e) => setNewCode({ ...newCode, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <Label htmlFor="usageLimit">Usage Limit</Label>
              <Input
                id="usageLimit"
                type="number"
                value={newCode.usageLimit}
                onChange={(e) => setNewCode({ ...newCode, usageLimit: parseInt(e.target.value) })}
                min="1"
                max="100"
                className="w-24"
              />
            </div>
            <Button 
              onClick={handleCreateCode} 
              disabled={isCreating}
              className="mt-6"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Generate Code'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Codes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Invitation Codes ({activeCodes.length})
          </CardTitle>
          <CardDescription>
            Currently valid invitation codes with real-time usage tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active invitation codes
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono font-bold">
                      {code.code}
                    </TableCell>
                    <TableCell className="capitalize">{code.role}</TableCell>
                    <TableCell className="capitalize">
                      {code.role === 'teacher' ? 'All Types' : '-'}
                    </TableCell>
                    <TableCell>
                      {getUsageBadge(code)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(code.expires_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(code.code)}
                          title="Copy code"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost" 
                          size="sm"
                          onClick={() => deactivateCode(code.id)}
                          title="Deactivate code"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCode(code.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete code"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Expired/Used Codes */}
      {expiredCodes.length > 0 && (
        <Collapsible open={showExpired} onOpenChange={setShowExpired}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50">
                <CardTitle className="flex items-center justify-between">
                  <span>Expired/Used Codes ({expiredCodes.length})</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showExpired ? 'transform rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Expired</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredCodes.map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.code}</TableCell>
                        <TableCell className="capitalize">{code.role}</TableCell>
                        <TableCell>
                          {getUsageBadge(code)}
                        </TableCell>
                        <TableCell>
                          {new Date(code.expires_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
};

export default InvitationCodeManagement;
