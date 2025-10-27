import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileImage, Trash2, FileText, File, Eye, Download, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import FilePreviewModal from './FilePreviewModal';

const ELEGANT_GOLD = '#C9A961';

const FileGallery = ({ item, itemType, onUpdate, canDelete = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState(item);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getFileIcon = (file) => {
    const filename = file.filename?.toLowerCase() || '';
    const contentType = file.content_type?.toLowerCase() || '';
    
    if (contentType.includes('pdf') || filename.endsWith('.pdf')) {
      return <FileText className="h-16 w-16 text-red-500" />;
    } else if (contentType.includes('word') || filename.endsWith('.doc') || filename.endsWith('.docx')) {
      return <FileText className="h-16 w-16 text-blue-500" />;
    } else if (contentType.includes('excel') || contentType.includes('spreadsheet') || filename.endsWith('.xls') || filename.endsWith('.xlsx')) {
      return <FileText className="h-16 w-16 text-green-500" />;
    } else if (filename.endsWith('.txt') || filename.endsWith('.md') || filename.endsWith('.note')) {
      return <FileText className="h-16 w-16" style={{ color: ELEGANT_GOLD }} />;
    } else {
      return <File className="h-16 w-16" style={{ color: ELEGANT_GOLD }} />;
    }
  };

  const handlePreview = (file, index) => {
    setPreviewFile(file);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const handleNavigate = (newIndex) => {
    if (currentItem.files && currentItem.files[newIndex]) {
      setPreviewFile(currentItem.files[newIndex]);
      setPreviewIndex(newIndex);
    }
  };

  const handleCopyLink = (file) => {
    navigator.clipboard.writeText(`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`);
    toast.success('File link copied!');
  };

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = `${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    toast.info(`Uploading ${files.length} file(s)...`);
    
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
        return null;
      }
    });
    
    const uploaded = await Promise.all(uploadPromises);
    const successful = uploaded.filter(f => f !== null);
    
    if (successful.length > 0) {
      const updatedFiles = [...(currentItem.files || []), ...successful];
      try {
        await api.put(`/${itemType}/${currentItem.id}`, {
          files: updatedFiles
        });
        
        setCurrentItem({ ...currentItem, files: updatedFiles });
        if (onUpdate) onUpdate();
        toast.success(`${successful.length} file(s) uploaded successfully!`);
      } catch (error) {
        console.error('Failed to update item:', error);
        toast.error('Failed to save files');
      }
    }
    
    e.target.value = '';
  };

  const handleDeleteFile = async (index) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    const updatedFiles = currentItem.files.filter((_, i) => i !== index);
    try {
      await api.put(`/${itemType}/${currentItem.id}`, {
        files: updatedFiles
      });
      
      setCurrentItem({ ...currentItem, files: updatedFiles });
      if (onUpdate) onUpdate();
      toast.success('File removed');
    } catch (error) {
      toast.error('Failed to remove file');
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setCurrentItem(item);
          setIsOpen(true);
        }}
        className="border hover:bg-gray-800"
        style={{ borderColor: ELEGANT_GOLD, color: ELEGANT_GOLD }}
      >
        <FileImage className="h-4 w-4 mr-1" />
        Files ({item.files?.length || 0})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 border max-w-4xl" style={{ borderColor: ELEGANT_GOLD }}>
          <DialogHeader>
            <DialogTitle style={{ color: ELEGANT_GOLD }}>
              Files - {currentItem.name || currentItem.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border rounded p-4" style={{ borderColor: ELEGANT_GOLD }}>
              <Label style={{ color: ELEGANT_GOLD }} className="mb-2 block">
                Upload Files (PDFs, Documents, Images, Notes - All file types supported)
              </Label>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="bg-black border text-white"
                style={{ borderColor: ELEGANT_GOLD }}
              />
              <p className="text-xs text-gray-400 mt-2">
                All team members can upload files. Accepts: PDFs, Documents (Word, Excel), Images, Notes (txt, md), and all other file types
              </p>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {currentItem.files && currentItem.files.length > 0 ? (
                currentItem.files.map((file, index) => (
                  <div key={index} className="relative group">
                    {file.content_type?.includes('image') ? (
                      <div className="relative">
                        <img
                          src={`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`}
                          alt={file.filename}
                          className="w-full h-40 object-cover rounded cursor-pointer hover:opacity-80 transition"
                          onClick={() => handlePreview(file, index)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Button size="sm" variant="ghost" onClick={() => handlePreview(file, index)} className="text-white">
                            <Eye className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition" onClick={() => handlePreview(file, index)}>
                        {getFileIcon(file)}
                      </div>
                    )}
                    <p className="text-xs text-gray-300 mt-2 truncate" title={file.filename}>
                      {file.filename}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handlePreview(file, index)}
                        className="flex-1 text-xs h-7 hover:bg-gray-700"
                        style={{ color: ELEGANT_GOLD }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleDownload(file)}
                        className="flex-1 text-xs h-7 hover:bg-gray-700"
                        style={{ color: ELEGANT_GOLD }}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleCopyLink(file)}
                        className="text-xs h-7 hover:bg-gray-700"
                        style={{ color: ELEGANT_GOLD }}
                      >
                        <LinkIcon className="h-3 w-3" />
                      </Button>
                      {canDelete && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteFile(index)}
                          className="text-xs h-7 text-red-500 hover:bg-red-950"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-400">
                  No files uploaded yet. Add files using the upload section above.
                </div>
              )}
            </div>
            
            {!canDelete && (
              <p className="text-xs text-gray-400 text-center mt-2">
                You can view and add files, but only Admins/Managers can delete files.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        files={currentItem.files || []}
        currentIndex={previewIndex}
        onNavigate={handleNavigate}
      />
    </>
  );
};

export default FileGallery;
