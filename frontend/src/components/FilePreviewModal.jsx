import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Printer, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const ELEGANT_GOLD = '#C9A961';

const FilePreviewModal = ({ isOpen, onClose, file, files = [], currentIndex = 0, onNavigate }) => {
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (isOpen && file) {
      setZoom(100);
      setLoading(true);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const fileType = file.content_type?.toLowerCase() || '';
  const filename = file.filename || '';
  const fileUrl = `${backendUrl}/api/uploads/${file.stored_filename}`;

  const isImage = fileType.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(filename);
  const isPDF = fileType.includes('pdf') || filename.endsWith('.pdf');
  const isVideo = fileType.includes('video') || /\.(mp4|webm|ogg|mov)$/i.test(filename);
  const isText = fileType.includes('text') || /\.(txt|md)$/i.test(filename);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fileUrl);
    toast.success('Link copied to clipboard');
  };

  const handlePrint = () => {
    if (isPDF || isImage) {
      const printWindow = window.open(fileUrl);
      printWindow?.print();
    }
  };

  const handlePrevious = () => {
    if (onNavigate && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (onNavigate && currentIndex < files.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] bg-gray-900 border" style={{ borderColor: ELEGANT_GOLD }}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white truncate max-w-md" title={filename}>
              {filename}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Navigation */}
              {allFiles.length > 1 && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="text-white hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-gray-400 text-sm">
                    {currentIndex + 1} / {allFiles.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleNext}
                    disabled={currentIndex === allFiles.length - 1}
                    className="text-white hover:bg-gray-800"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-6 bg-gray-700 mx-2" />
                </>
              )}

              {/* Zoom controls for images */}
              {isImage && (
                <>
                  <Button size="sm" variant="ghost" onClick={handleZoomOut} className="text-white hover:bg-gray-800">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-gray-400 text-sm w-12 text-center">{zoom}%</span>
                  <Button size="sm" variant="ghost" onClick={handleZoomIn} className="text-white hover:bg-gray-800">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-gray-700 mx-2" />
                </>
              )}

              {/* Actions */}
              <Button size="sm" variant="ghost" onClick={handleCopyLink} className="text-white hover:bg-gray-800" title="Copy link">
                <LinkIcon className="h-4 w-4" />
              </Button>
              {(isPDF || isImage) && (
                <Button size="sm" variant="ghost" onClick={handlePrint} className="text-white hover:bg-gray-800" title="Print">
                  <Printer className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={handleDownload} className="text-white hover:bg-gray-800" title="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} className="text-white hover:bg-gray-800">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-black rounded flex items-center justify-center p-4">
          {isImage && (
            <img
              src={fileUrl}
              alt={filename}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                transform: `scale(${zoom / 100})`,
                transition: 'transform 0.2s'
              }}
              onLoad={() => setLoading(false)}
              className="object-contain"
            />
          )}
          
          {isPDF && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              onLoad={() => setLoading(false)}
              title={filename}
            />
          )}

          {isVideo && (
            <video
              src={fileUrl}
              controls
              className="max-w-full max-h-full"
              onLoadedData={() => setLoading(false)}
            >
              Your browser does not support video playback.
            </video>
          )}

          {isText && (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setLoading(false)}
              title={filename}
            />
          )}

          {!isImage && !isPDF && !isVideo && !isText && (
            <div className="text-center">
              <div className="mb-4" style={{ color: ELEGANT_GOLD }}>
                <svg className="w-24 h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-4">Preview not available for this file type</p>
              <Button onClick={handleDownload} className="text-black" style={{ backgroundColor: ELEGANT_GOLD }}>
                <Download className="mr-2 h-4 w-4" />
                Download to View
              </Button>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: ELEGANT_GOLD }}></div>
            </div>
          )}
        </div>

        <div className="text-center text-gray-400 text-sm py-2">
          <span>Size: {(file.size / 1024).toFixed(2)} KB</span>
          {file.uploaded_by && <span className="ml-4">Uploaded by: {file.uploaded_by}</span>}
          {file.created_at && <span className="ml-4">Date: {new Date(file.created_at).toLocaleDateString()}</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewModal;
