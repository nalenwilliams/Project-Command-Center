import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Eye, Download, Link as LinkIcon, Trash2, FileText, File, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import FilePreviewModal from './FilePreviewModal';

const ELEGANT_GOLD = '#C9A961';

const FileGalleryFullScreen = ({ isOpen, onClose, record, recordType, files = [], onDelete, canDelete = false }) => {
  const [previewFile, setPreviewFile] = useState(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!isOpen) return null;

  const getFileIcon = (file) => {
    const filename = file.filename?.toLowerCase() || '';
    const contentType = file.content_type?.toLowerCase() || '';
    
    if (contentType.includes('pdf') || filename.endsWith('.pdf')) {
      return <FileText className="h-24 w-24 text-red-500" />;
    } else if (contentType.includes('word') || filename.endsWith('.doc') || filename.endsWith('.docx')) {
      return <FileText className="h-24 w-24 text-blue-500" />;
    } else if (contentType.includes('excel') || contentType.includes('spreadsheet') || filename.endsWith('.xls') || filename.endsWith('.xlsx')) {
      return <FileText className="h-24 w-24 text-green-500" />;
    } else if (filename.endsWith('.txt') || filename.endsWith('.md') || filename.endsWith('.note')) {
      return <FileText className="h-24 w-24" style={{ color: ELEGANT_GOLD }} />;
    } else {
      return <File className="h-24 w-24" style={{ color: ELEGANT_GOLD }} />;
    }
  };

  const handlePreview = (file, index) => {
    setPreviewFile(file);
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const handleNavigate = (newIndex) => {
    if (files && files[newIndex]) {
      setPreviewFile(files[newIndex]);
      setPreviewIndex(newIndex);
    }
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

  const handleCopyLink = (file) => {
    navigator.clipboard.writeText(`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`);
    toast.success('File link copied!');
  };

  const getRecordTitle = () => {
    switch(recordType) {
      case 'project': return record?.name || 'Project';
      case 'task': return record?.title || 'Task';
      case 'client': return record?.name || 'Client';
      case 'invoice': return `Invoice #${record?.invoice_number || ''}`;
      case 'expense': return record?.description || 'Expense';
      case 'contract': return record?.title || 'Contract';
      case 'equipment': return record?.name || 'Equipment';
      case 'timesheet': return `Timesheet - ${record?.employee_name || ''}`;
      case 'safety-report': return record?.title || 'Safety Report';
      case 'certification': return record?.name || 'Certification';
      case 'inventory': return record?.item_name || 'Inventory Item';
      case 'report': return record?.title || 'Report';
      case 'compliance': return record?.title || 'Compliance';
      default: return 'Files';
    }
  };

  const getRecordDetails = () => {
    switch(recordType) {
      case 'project':
        return `Status: ${record?.status || 'N/A'} | Client: ${record?.client_name || 'N/A'}`;
      case 'task':
        return `Status: ${record?.status || 'N/A'} | Priority: ${record?.priority || 'N/A'}`;
      case 'client':
        return `Email: ${record?.email || 'N/A'}`;
      case 'invoice':
        return `Amount: $${record?.amount || 0} | Status: ${record?.status || 'N/A'}`;
      case 'expense':
        return `Amount: $${record?.amount || 0} | Category: ${record?.category || 'N/A'}`;
      case 'contract':
        return `Status: ${record?.status || 'N/A'} | Client: ${record?.client_name || 'N/A'}`;
      case 'equipment':
        return `Status: ${record?.status || 'N/A'} | Location: ${record?.location || 'N/A'}`;
      case 'safety-report':
        return `Severity: ${record?.severity || 'N/A'} | Status: ${record?.status || 'N/A'}`;
      case 'certification':
        return `Employee: ${record?.employee_name || 'N/A'}`;
      case 'inventory':
        return `Quantity: ${record?.quantity || 0} ${record?.unit || ''}`;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between" style={{ borderColor: ELEGANT_GOLD, backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-800">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: ELEGANT_GOLD }}>
              {getRecordTitle()}
            </h1>
            <p className="text-sm text-gray-400 mt-1">{getRecordDetails()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{files.length} {files.length === 1 ? 'file' : 'files'}</span>
          <Button variant="ghost" onClick={onClose} className="text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <File className="h-24 w-24 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No files attached yet</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                {/* File Preview */}
                <div 
                  className="relative bg-gray-900 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-opacity-100 transition-all"
                  style={{ borderColor: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = ELEGANT_GOLD}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                  onClick={() => handlePreview(file, index)}
                >
                  {file.content_type?.includes('image') ? (
                    <div className="relative w-full h-48">
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}/api/uploads/${file.stored_filename}`}
                        alt={file.filename}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center">
                        <Eye className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transition" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="mt-2">
                  <p className="text-sm text-white truncate font-medium" title={file.filename}>
                    {file.filename}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                  {file.uploaded_by && (
                    <p className="text-xs text-gray-500">
                      By: {file.uploaded_by}
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-1 mt-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handlePreview(file, index)}
                    className="flex-1 text-xs h-8 hover:bg-gray-800"
                    style={{ color: ELEGANT_GOLD }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleDownload(file)}
                    className="flex-1 text-xs h-8 hover:bg-gray-800"
                    style={{ color: ELEGANT_GOLD }}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleCopyLink(file)}
                    className="text-xs h-8 hover:bg-gray-800"
                    style={{ color: ELEGANT_GOLD }}
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                  {canDelete && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onDelete(file.id)}
                      className="text-xs h-8 text-red-500 hover:bg-red-950"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        file={previewFile}
        files={files}
        currentIndex={previewIndex}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default FileGalleryFullScreen;
