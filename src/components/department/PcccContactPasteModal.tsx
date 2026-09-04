import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ClipboardPaste, CheckCircle2, AlertCircle, Sparkles, PhoneCall, Building, ArrowRight, CornerDownLeft } from 'lucide-react';
import { parseEmergencyContactsTable, ParseContactsResult } from '../../utils/pcccContactParser';
import { toast } from '../../utils/toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (patch: Record<string, string>) => void;
}

export default function PcccContactPasteModal({ isOpen, onClose, onApply }: Props) {
  const [rawText, setRawText] = useState('');
  const [parseResult, setParseResult] = useState<ParseContactsResult | null>(null);

  if (!isOpen) return null;

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLDivElement>) => {
    const textData = e.clipboardData.getData('text/plain') || '';
    const htmlData = e.clipboardData.getData('text/html') || '';
    
    if (!textData.trim() && !htmlData.trim()) return;

    setRawText(textData);
    const parsed = parseEmergencyContactsTable(textData, htmlData);
    setParseResult(parsed);

    if (parsed.matchedCount > 0) {
      toast.success(`Đã nhận diện thành công ${parsed.matchedCount} mục danh bạ!`);
    } else {
      toast.error('Chưa nhận diện được cấu trúc bảng phù hợp, vui lòng kiểm tra lại!');
    }
  };

  const handleReadClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        toast.error('Trình duyệt chưa cấp quyền truy cập clipboard tự động. Vui lòng click vào ô và nhấn Ctrl + V!');
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error('Clipboard hiện đang trống. Hãy copy bảng trong PowerPoint trước!');
        return;
      }
      setRawText(text);
      const parsed = parseEmergencyContactsTable(text);
      setParseResult(parsed);
      if (parsed.matchedCount > 0) {
        toast.success(`Đã nhận diện thành công ${parsed.matchedCount} mục danh bạ!`);
      } else {
        toast.error('Chưa nhận diện được thông tin danh bạ từ dữ liệu vừa dán.');
      }
    } catch (err) {
      toast.error('Vui lòng click chuột vào ô dán và nhấn phím Ctrl + V!');
    }
  };

  const handleApply = () => {
    if (!parseResult || Object.keys(parseResult.patch).length === 0) {
      toast.error('Không có dữ liệu danh bạ hợp lệ để áp dụng!');
      return;
    }
    onApply(parseResult.patch);
    toast.success(`Đã điền ${Object.keys(parseResult.patch).length / 2 | 0} mục danh bạ vào form!`);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRawText('');
    setParseResult(null);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-purple-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <ClipboardPaste className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                Dán Bảng Danh bạ Khẩn cấp (PowerPoint / Excel)
              </h3>
              <p className="text-xs text-purple-200 font-normal">
                Tự động nhận diện 15 dòng mẫu PC01, bóc tách tên & số điện thoại chuẩn xác
              </p>
            </div>
          </div>
          <button
            onClick={() => { handleReset(); onClose(); }}
            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar bg-slate-50/50">
          
          {/* Hướng dẫn & Vùng dán */}
          {!parseResult || parseResult.rows.length === 0 ? (
            <div className="space-y-4">
              <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl text-xs text-purple-900 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Cách thực hiện nhanh:</p>
                  <p>1. Mở slide PowerPoint hoặc file Excel, bôi đen toàn bộ bảng danh bạ và nhấn <kbd className="px-1.5 py-0.5 bg-white border border-purple-300 rounded font-mono font-bold text-purple-700">Ctrl + C</kbd>.</p>
                  <p>2. Nhấp vào khung bên dưới và nhấn <kbd className="px-1.5 py-0.5 bg-white border border-purple-300 rounded font-mono font-bold text-purple-700">Ctrl + V</kbd> (hoặc bấm nút "Dán từ Clipboard").</p>
                  <p className="text-purple-700 italic">Hệ thống sẽ tự động bỏ qua dòng 113, bỏ qua cột Ghi chú và điền đủ các mục vào form.</p>
                </div>
              </div>

              {/* Paste Zone */}
              <div 
                onPaste={handlePasteEvent}
                tabIndex={0}
                className="border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-2xl p-8 sm:p-12 text-center bg-white hover:bg-purple-50/20 transition-all cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:border-transparent flex flex-col items-center justify-center space-y-3 shadow-xs"
              >
                <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardPaste className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-base group-hover:text-purple-700 transition-colors">
                    Nhấp vào đây và nhấn <span className="text-purple-700 font-black">Ctrl + V</span> để Dán
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Nhận diện trực tiếp bảng copy từ PowerPoint hoặc Excel
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleReadClipboard(); }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <ClipboardPaste className="w-4 h-4" /> Dán từ Clipboard
                  </button>
                </div>

                {/* Textarea phụ cho phép paste trực tiếp nếu cần */}
                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    if (e.target.value.trim()) {
                      const res = parseEmergencyContactsTable(e.target.value);
                      setParseResult(res);
                    }
                  }}
                  onPaste={handlePasteEvent}
                  placeholder="Hoặc dán trực tiếp nội dung văn bản bảng vào đây..."
                  rows={2}
                  className="w-full mt-4 p-2 text-xs border border-gray-200 rounded-lg outline-hidden focus:border-purple-400 text-gray-700 bg-gray-50/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          ) : (
            /* Kết quả Live Preview */
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Thống kê tóm tắt */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã nhận diện: {parseResult.matchedCount} mục
                  </span>
                  {parseResult.skippedCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 font-medium text-xs rounded-full">
                      Bỏ qua: {parseResult.skippedCount} (Dòng 113)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-semibold text-purple-700 hover:underline hover:text-purple-800"
                >
                  Dán lại bảng khác
                </button>
              </div>

              {/* Bảng xem trước */}
              <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs max-h-[50vh] custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-purple-50/80 text-purple-900 border-b border-purple-100 sticky top-0 z-10">
                    <tr>
                      <th className="p-3 font-bold w-12 text-center">STT</th>
                      <th className="p-3 font-bold w-1/4">Cơ quan / Bộ phận</th>
                      <th className="p-3 font-bold w-1/3">Tên trích xuất</th>
                      <th className="p-3 font-bold">Số điện thoại</th>
                      <th className="p-3 font-bold text-center w-28">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {parseResult.rows.map((row, idx) => {
                      if (row.status === 'skipped') {
                        return (
                          <tr key={idx} className="bg-gray-50/60 text-gray-400 italic">
                            <td className="p-2.5 text-center font-bold">{row.stt || idx + 1}</td>
                            <td className="p-2.5">{row.rawDept}</td>
                            <td className="p-2.5">{row.name || '---'}</td>
                            <td className="p-2.5">{row.phone || '---'}</td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded">
                                Bỏ qua
                              </span>
                            </td>
                          </tr>
                        );
                      }

                      const isLeadership = row.nameKey === 'ten_giam_doc' || row.nameKey === 'ten_ptkd_dvpt' || row.nameKey === 'ten_ptkd_xe';

                      return (
                        <tr key={idx} className={`hover:bg-purple-50/30 transition-colors ${isLeadership ? 'bg-blue-50/30' : ''}`}>
                          <td className="p-2.5 text-center font-bold text-gray-500">{row.stt || idx + 1}</td>
                          <td className="p-2.5 font-bold text-gray-800">
                            {row.rawDept}
                            {row.matchedRole && row.matchedRole !== row.rawDept && (
                              <span className="block text-[10px] text-purple-600 font-normal">
                                ➔ {row.matchedRole}
                              </span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-gray-900">{row.name || '---'}</span>
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              📞 {row.phone || '---'}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            {row.status === 'matched' ? (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded ${isLeadership ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                <CheckCircle2 className="w-3 h-3" /> {isLeadership ? 'Lãnh đạo' : 'Khớp'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded">
                                <AlertCircle className="w-3 h-3" /> Chưa nhận diện
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center shrink-0">
          <button
            type="button"
            onClick={() => { handleReset(); onClose(); }}
            className="px-5 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          {parseResult && parseResult.matchedCount > 0 && (
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Áp dụng vào Hồ sơ PCCC
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
