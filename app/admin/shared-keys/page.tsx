'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAdminSharedKeys } from '@/hooks/useAdminSharedKeys';
import AdminLayout from '@/components/admin/AdminLayout';
import { LiveClock } from '@/components/admin/LiveClock';
import { Plus, Key, Trash2, Power, PowerOff, Crown, ChevronLeft, Edit } from 'lucide-react';

interface SharedKey {
  id: string;
  provider: string;
  apiKeyMasked: string;
  models: string[];
  isActive: boolean;
  createdAt: string;
}

interface ModelOption {
  value: string;
  label: string;
  provider: string;
}

export default function SharedKeysPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { keys, isLoading, invalidateKeys } = useAdminSharedKeys();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [editAvailableModels, setEditAvailableModels] = useState<ModelOption[]>([]);
  const [loadingEditModels, setLoadingEditModels] = useState(false);
  
  // Form state
  const [provider, setProvider] = useState<string>('');
  const [apiKey, setApiKey] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  // Edit state
  const [editingKey, setEditingKey] = useState<SharedKey | null>(null);
  const [editSelectedModels, setEditSelectedModels] = useState<string[]>([]);

  // Fetch models when provider or API key changes in Add dialog
  const fetchModelsForKey = async (providerValue: string, apiKeyValue: string, isEdit: boolean) => {
    if (isEdit) {
      setLoadingEditModels(true);
    } else {
      setLoadingModels(true);
    }

    try {
      const response = await fetch('/api/admin/shared-keys/fetch-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: providerValue,
          apiKey: apiKeyValue,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch models');
      }

      const data = await response.json();
      
      if (isEdit) {
        setEditAvailableModels(data.models);
      } else {
        setAvailableModels(data.models);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch models',
        variant: 'destructive',
      });
      
      if (isEdit) {
        setEditAvailableModels([]);
      } else {
        setAvailableModels([]);
      }
    } finally {
      if (isEdit) {
        setLoadingEditModels(false);
      } else {
        setLoadingModels(false);
      }
    }
  };

  useEffect(() => {
    if (provider && apiKey && dialogOpen) {
      fetchModelsForKey(provider, apiKey, false);
    } else {
      setAvailableModels([]);
      setSelectedModels([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, apiKey, dialogOpen]);

  const handleAddKey = async () => {
    if (!provider || !apiKey || selectedModels.length === 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/shared-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, models: selectedModels }),
      });

      if (!response.ok) throw new Error('Failed to add shared key');

      toast({
        title: 'Success',
        description: 'Shared API key added successfully',
      });

      setDialogOpen(false);
      setProvider('');
      setApiKey('');
      setSelectedModels([]);
      setAvailableModels([]);
      invalidateKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add shared key',
        variant: 'destructive',
      });
    }
  };

  const toggleKeyStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/admin/shared-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to toggle key status');

      toast({
        title: 'Success',
        description: `Key ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });

      invalidateKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle key status',
        variant: 'destructive',
      });
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shared API key?')) return;

    try {
      const response = await fetch(`/api/admin/shared-keys?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete key');

      toast({
        title: 'Success',
        description: 'Shared API key deleted successfully',
      });

      invalidateKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete key',
        variant: 'destructive',
      });
    }
  };

  const toggleModelSelection = (modelValue: string) => {
    setSelectedModels(prev =>
      prev.includes(modelValue)
        ? prev.filter(m => m !== modelValue)
        : [...prev, modelValue]
    );
  };

  const toggleEditModelSelection = (modelValue: string) => {
    setEditSelectedModels(prev =>
      prev.includes(modelValue)
        ? prev.filter(m => m !== modelValue)
        : [...prev, modelValue]
    );
  };

  const openEditDialog = async (key: SharedKey) => {
    setEditingKey(key);
    setEditSelectedModels(key.models);
    setEditDialogOpen(true);
    
    // Fetch the full API key from the server to load models
    try {
      const response = await fetch(`/api/admin/shared-keys/decrypt?id=${key.id}`);
      if (response.ok) {
        const data = await response.json();
        await fetchModelsForKey(key.provider, data.apiKey, true);
      }
    } catch (error) {
      console.error('Failed to load models for editing:', error);
    }
  };

  const handleEditModels = async () => {
    if (!editingKey || editSelectedModels.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one model',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/shared-keys/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingKey.id, models: editSelectedModels }),
      });

      if (!response.ok) throw new Error('Failed to update models');

      toast({
        title: 'Success',
        description: 'Models updated successfully',
      });

      setEditDialogOpen(false);
      setEditingKey(null);
      setEditSelectedModels([]);
      setEditAvailableModels([]);
      invalidateKeys();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update models',
        variant: 'destructive',
      });
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'OPENAI':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ANTHROPIC':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'GEMINI':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <AdminLayout>
      {/* Top Navigation Bar */}
      <div className="h-16 bg-white border-b border-slate-200/60 flex items-center px-8 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin')}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h2 className="text-lg font-bold text-slate-900">Shared API Keys</h2>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
            <Crown className="w-3 h-3 mr-1" />
            PLUS Feature
          </Badge>
        </div>
        <LiveClock />
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-[42px] font-bold text-slate-900 leading-tight">
                  Shared API Keys
                </h1>
                <p className="text-lg text-slate-500">
                  Configure API keys for PLUS users to use without adding their own
                </p>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Shared Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Shared API Key</DialogTitle>
                    <DialogDescription>
                      Add an API key that PLUS users can use for generation
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Provider</Label>
                      <Select value={provider} onValueChange={setProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OPENAI">OpenAI</SelectItem>
                          <SelectItem value="ANTHROPIC">Anthropic</SelectItem>
                          <SelectItem value="GEMINI">Google Gemini</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk-..."
                      />
                    </div>

                    {provider && apiKey && (
                      <div>
                        <Label>Select Models ({selectedModels.length} selected)</Label>
                        {loadingModels ? (
                          <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                            Loading models from API...
                          </div>
                        ) : availableModels.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mt-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                            {availableModels.map((model) => (
                              <Button
                                key={model.value}
                                variant={selectedModels.includes(model.value) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleModelSelection(model.value)}
                                className="justify-start text-left h-auto py-2"
                              >
                                <span className="truncate">{model.label}</span>
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm text-slate-500 py-4 text-center border border-dashed rounded-lg">
                            {apiKey ? 'Enter a valid API key to load models' : 'Enter API key above to load available models'}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddKey}>
                        Add Key
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          {/* Keys List */}
          <div className="space-y-4">
            {isLoading ? (
              <Card className="p-12 text-center">
                <div className="text-slate-900 text-5xl font-bold">
                  <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                  <span className="inline-block animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                </div>
              </Card>
            ) : keys.length === 0 ? (
              <Card className="p-12 text-center">
                <Key className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No shared API keys configured
                </h3>
                <p className="text-slate-500 mb-4">
                  Add API keys that PLUS users can use for content generation
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Key
                </Button>
              </Card>
            ) : (
              keys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getProviderColor(key.provider)}>
                            {key.provider}
                          </Badge>
                          <Badge
                            variant={key.isActive ? 'default' : 'secondary'}
                            className={key.isActive ? 'bg-green-100 text-green-700' : ''}
                          >
                            {key.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <span className="text-sm text-slate-500 font-mono">
                            {key.apiKeyMasked}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {key.models.map((model) => (
                            <Badge key={model} variant="outline" className="text-xs">
                              {model}
                            </Badge>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500 mt-3">
                          Added {new Date(key.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(key)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Models
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyStatus(key.id, key.isActive)}
                        >
                          {key.isActive ? (
                            <>
                              <PowerOff className="w-4 h-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Power className="w-4 h-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteKey(key.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Edit Models Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Sponsored Models</DialogTitle>
                <DialogDescription>
                  Select which models from this API key should be available to PLUS users
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {editingKey && (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <Badge className={getProviderColor(editingKey.provider)}>
                        {editingKey.provider}
                      </Badge>
                      <span className="text-sm text-slate-500 font-mono">
                        {editingKey.apiKeyMasked}
                      </span>
                    </div>

                    <div>
                      <Label>Select Models ({editSelectedModels.length} selected)</Label>
                      {loadingEditModels ? (
                        <div className="flex items-center justify-center py-8 text-sm text-slate-500">
                          Loading models from API...
                        </div>
                      ) : editAvailableModels.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-2 max-h-[300px] overflow-y-auto p-2 border rounded-lg">
                          {editAvailableModels.map((model) => (
                            <Button
                              key={model.value}
                              variant={editSelectedModels.includes(model.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleEditModelSelection(model.value)}
                              className="justify-start text-left h-auto py-2"
                            >
                              <span className="truncate">{model.label}</span>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 py-4 text-center border border-dashed rounded-lg">
                          Loading models...
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditModels}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AdminLayout>
  );
}
