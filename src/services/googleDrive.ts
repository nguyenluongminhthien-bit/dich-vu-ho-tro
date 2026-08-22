// Service kết nối và tìm kiếm tệp tin từ Google Drive API v3
export const GOOGLE_API_KEY = "AIzaSyA4P9hXbuk3Iusk5MWQpIE-1beErC2z8nU";
export const ROOT_FOLDER_ID = "1hdwEa6aTBARJs720LGT7qxfwJFOg6U68";

// Trích xuất số hiệu dạng số nguyên kèm theo chữ cái hậu tố (ví dụ: "01/2026/TB" -> "01", "541A/2025/TB" -> "541A")
export const extractDocNumber = (soHieu: string): string => {
  if (!soHieu) return "";
  // Tìm cụm chữ số đầu tiên kèm theo chữ cái viết liền kề (ví dụ: 541A hoặc 05 hoặc 5)
  const match = soHieu.match(/(\d+)([A-Za-z]*)/);
  if (match) {
    const digits = match[1];
    const suffix = match[2] || "";
    // Đảm bảo số đơn có số 0 ở trước (ví dụ: "5" -> "05", "5A" -> "05A")
    const paddedDigits = digits.length === 1 ? "0" + digits : digits;
    return paddedDigits + suffix;
  }
  return soHieu.trim();
};


// Ánh xạ Loại văn bản sang tên thư mục con tương ứng
const getFolderSuffix = (phanLoai: string): string => {
  switch (phanLoai) {
    case "Công văn đi":
      return "CV Đi";
    case "Công văn đến":
      return "CV Đến";
    case "Quyết định":
      return "Quyết định";
    case "Thông báo":
      return "Thông báo";
    case "Thông báo BĐH":
      return "Thông báo BĐH";
    case "Tờ trình":
      return "Tờ trình";
    default:
      return phanLoai;
  }
};

// Ánh xạ Loại văn bản sang các tiền tố tên file PDF có thể có (ví dụ: Quyết định có thể viết tắt là QĐ hoặc QD)
const getFilePrefixes = (phanLoai: string): string[] => {
  switch (phanLoai) {
    case "Công văn đi":
      return ["CV"];
    case "Công văn đến":
      return ["CVĐ", "CVD"];
    case "Quyết định":
      return ["QĐ", "QD"];
    case "Thông báo":
    case "Thông báo BĐH":
      return ["TB"];
    case "Tờ trình":
      return ["TTr", "TT"];
    default:
      return ["VB"];
  }
};

// Hàm truy vấn Google Drive API v3
const fetchDriveFiles = async (q: string): Promise<any[]> => {
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&key=${GOOGLE_API_KEY}&fields=files(id,name,webViewLink)`;
  
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Lỗi HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.files || [];
};

/**
 * Tìm kiếm link file văn bản trên Google Drive dựa theo cấu trúc:
 * Root ➔ [Năm] ➔ [Năm]. [Loại VB] ➔ Quét tất cả file PDF và dùng Regex so khớp thông minh
 */
export const searchGoogleDriveFile = async (
  year: string,
  phanLoai: string,
  soHieu: string
): Promise<string | null> => {
  if (!year || !phanLoai || !soHieu) return null;

  const docNum = extractDocNumber(soHieu);
  if (!docNum) return null;

  const folderSuffix = phanLoai === "Công văn đi" ? "CV Đi" :
                       phanLoai === "Công văn đến" ? "CV Đến" : phanLoai;
  const typeFolderName = `${year}. ${folderSuffix}`;

  try {
    // 1. Tìm Thư mục Năm (ví dụ: "2026") trong Thư mục Gốc
    const yearFolders = await fetchDriveFiles(
      `'${ROOT_FOLDER_ID}' in parents and name = '${year}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    if (yearFolders.length === 0) return null;
    const yearFolderId = yearFolders[0].id;

    // 2. Tìm Thư mục Loại văn bản (ví dụ: "2026. Quyết định") trong Thư mục Năm
    const typeFolders = await fetchDriveFiles(
      `'${yearFolderId}' in parents and name = '${typeFolderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    if (typeFolders.length === 0) return null;
    const typeFolderId = typeFolders[0].id;

    // 3. Tải toàn bộ danh sách tệp tin PDF trong thư mục Loại văn bản
    const files = await fetchDriveFiles(
      `'${typeFolderId}' in parents and mimeType = 'application/pdf' and trashed = false`
    );

    if (files.length === 0) return null;

    // Phân tích docNum để lấy phần số và phần chữ suffix (ví dụ: "12B" -> số "12", suffix "B")
    const numMatch = docNum.match(/^0*(\d+)([A-Za-z]*)$/);
    if (!numMatch) return null;
    const numStr = numMatch[1];
    const suffix = numMatch[2] || "";

    const prefixes = getFilePrefixes(phanLoai);
    const prefixPattern = prefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    
    // Regex khớp: (prefix)(ký tự phân cách như space, dot, gạch ngang không bắt buộc)(các số 0 không bắt buộc)(số hiệu)(chữ cái suffix)(ký tự không phải chữ số/chữ cái ở sau hoặc cuối chuỗi)
    // Ví dụ: /(^|[^a-zA-Z0-9])(QD|QĐ)[\s._]*0*9([^a-zA-Z0-9]|$)/i
    const exactPattern = new RegExp(`(^|[^a-zA-Z0-9])(${prefixPattern})[\\s._]*0*${numStr}${suffix}([^a-zA-Z0-9]|$)`, 'i');

    const exactMatch = files.find(file => {
      const name = file.name || "";
      return exactPattern.test(name);
    });

    return exactMatch ? exactMatch.webViewLink || null : null;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm tệp Google Drive:", error);
    throw error;
  }
};
