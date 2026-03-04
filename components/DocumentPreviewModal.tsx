
import React from 'react';
import { VanBan } from '../types';
import { X, ExternalLink, Download, FileText, Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: VanBan | null;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({ isOpen, onClose, doc }) => {
  if (!isOpen || !doc) return null;

  // Function to transform Google Drive link to preview link if necessary
  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    // If it's a Google Drive view link, we can try to convert it to a preview link
    if (url.includes('drive.google.com') && url.includes('/view')) {
      return url.replace('/view', '/preview');
    }
    return url;
  };

  const previewUrl = getPreviewUrl(doc.linkFile);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 md:p-8">
      <div className="bg-white rounded-none sm:rounded-2xl shadow-2xl w-full h-full max-w-6xl flex flex-col overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-gray-50 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="p-1.5 sm:p-2 bg-blue-100 text-primary rounded-lg shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                {doc.soHieu} - {doc.noiDungTen}
              </h2>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium uppercase truncate">
                {doc.loai === 'ThongBao' ? doc.loaiVanBan : doc.dmQuyTrinh} | Ngày BH: {doc.ngayBanHanh}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a 
              href={doc.linkFile} 
              target="_blank" 
              rel="noreferrer" 
              className="p-1.5 sm:p-2 text-gray-500 hover:text-primary hover:bg-gray-200 rounded-full transition-all"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
            <button 
              onClick={onClose} 
              className="p-1.5 sm:p-2 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full transition-all"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 bg-gray-100 relative">
          {previewUrl ? (
            <iframe 
              src={previewUrl} 
              className="w-full h-full border-none"
              title="Document Preview"
              allow="autoplay"
            ></iframe>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-6 sm:p-8 text-center">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 opacity-20" />
              <p className="text-base sm:text-lg font-medium">Không có bản xem trước cho văn bản này</p>
              <p className="text-xs sm:text-sm">Vui lòng kiểm tra lại đường dẫn file hoặc mở trong tab mới.</p>
              <a 
                href={doc.linkFile} 
                target="_blank" 
                rel="noreferrer" 
                className="mt-4 px-5 sm:px-6 py-2 bg-primary text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-all text-sm sm:text-base"
              >
                Mở file gốc
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center shrink-0 px-4 sm:px-6 gap-2">
          <div className="text-[9px] sm:text-[10px] text-gray-400 italic text-center sm:text-left">
            * Một số file có thể yêu cầu đăng nhập Google để xem trước.
          </div>
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-6 py-2 bg-gray-800 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all"
          >
            ĐÓNG
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreviewModal;
