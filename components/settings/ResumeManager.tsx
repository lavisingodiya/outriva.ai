'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useResumes } from '@/hooks/useResumes';
import { Loader2, Upload, FileText, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResumeManager() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeTitle, setResumeTitle] = useState('');

  // Use shared hook for resumes
  const { resumes, isLoading: loading, invalidateResumes } = useResumes();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOCX, or TXT file',
          variant: 'destructive',
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      // Auto-fill title from filename
      if (!resumeTitle) {
        const filename = file.name.replace(/\.(pdf|docx|txt)$/i, '');
        setResumeTitle(filename);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a resume file to upload',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only PDF and DOCX files are allowed',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (3MB limit)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    if (selectedFile.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'File size must be less than 3MB',
        variant: 'destructive',
      });
      return;
    }

    if (!resumeTitle.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for this resume',
        variant: 'destructive',
      });
      return;
    }

    if (resumes.length >= 3) {
      toast({
        title: 'Maximum resumes reached',
        description: 'You can only store up to 3 resumes. Please delete one first.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', resumeTitle.trim());

      const response = await fetch('/api/settings/resumes', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload resume');
      }

      const data = await response.json();

      toast({
        title: 'Success',
        description: 'Resume uploaded successfully!',
      });

      // Reset form
      setSelectedFile(null);
      setResumeTitle('');
      const fileInput = document.getElementById('resume-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Invalidate cache to refresh resumes
      invalidateResumes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/resumes?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resume');
      }

      toast({
        title: 'Success',
        description: 'Resume deleted successfully',
      });

      // Invalidate cache to refresh resumes
      invalidateResumes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch('/api/settings/resumes/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set default resume');
      }

      toast({
        title: 'Success',
        description: 'Default resume updated',
      });

      // Invalidate cache to refresh resumes
      invalidateResumes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upload Section */}
      <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">Upload Resume</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Upload up to 3 resumes. Supported formats: PDF, DOCX (max 3MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
          <div className="space-y-2">
            <Label htmlFor="resume-title" className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Resume Title</Label>
            <Input
              id="resume-title"
              placeholder="e.g., Software Engineer Resume"
              value={resumeTitle}
              onChange={(e) => setResumeTitle(e.target.value)}
              disabled={uploading}
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resume-file" className="text-sm sm:text-base text-slate-900 dark:text-gray-100">Resume File</Label>
            <Input
              id="resume-file"
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={uploading || resumes.length >= 3}
              className="h-10 sm:h-11 text-sm sm:text-base bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            />
            <p className="text-xs text-muted-foreground">
              Only PDF and DOCX files are allowed. Maximum file size: 3MB
            </p>
          </div>

          {selectedFile && (
            <div className="text-xs sm:text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || !selectedFile || resumes.length >= 3}
            className="w-full h-10 sm:h-11 text-sm sm:text-base"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Resume
              </>
            )}
          </Button>

          {resumes.length >= 3 && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2.5 sm:p-3">
              <p className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400">
                Maximum of 3 resumes reached. Delete one to upload a new resume.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumes List */}
      <Card className="bg-white dark:bg-gray-800 border-slate-200/60 dark:border-gray-700">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg text-slate-900 dark:text-gray-100">Your Resumes ({resumes.length}/3)</CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
            Manage your stored resumes. Set one as default to use it automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No resumes uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm sm:text-base truncate">{resume.title}</p>
                        {resume.isDefault && (
                          <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded flex-shrink-0">
                            <Check className="h-3 w-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(resume.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!resume.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(resume.id)}
                        className="text-xs sm:text-sm h-8 sm:h-9"
                      >
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(resume.id)}
                      className="h-8 sm:h-9"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
          <strong>Note:</strong> Resume content is extracted automatically and stored securely.
          Your default resume will be used for generating cover letters and messages.
        </p>
      </div>
    </div>
  );
}
