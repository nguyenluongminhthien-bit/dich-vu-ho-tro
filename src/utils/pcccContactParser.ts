import { formatPhoneNumber, toUnaccented } from './formatters';

export interface ParsedContactRow {
  stt?: number;
  rawDept: string;
  matchedRole: string;
  name: string;
  phone: string;
  nameKey?: string;
  phoneKey?: string;
  status: 'matched' | 'skipped' | 'unrecognized';
  statusLabel: string;
}

export interface ParseContactsResult {
  patch: Record<string, string>;
  rows: ParsedContactRow[];
  matchedCount: number;
  skippedCount: number;
}

interface ContactDefinition {
  id: string;
  label: string;
  nameKey: string;
  phoneKey: string;
  defaultStt: number;
  matchPatterns: string[];
}

const CONTACT_DEFINITIONS: ContactDefinition[] = [
  {
    id: 'ca_pccc',
    label: 'Cảnh sát PCCC',
    nameKey: 'ten_ca_pccc',
    phoneKey: 'sdt_ca_pccc',
    defaultStt: 2,
    matchPatterns: ['canh sat pccc', 'cs pccc', 'pccc va cnch', 'phong pccc']
  },
  {
    id: 'yte',
    label: 'Cấp cứu y tế',
    nameKey: 'ten_yte',
    phoneKey: 'sdt_yte',
    defaultStt: 3,
    matchPatterns: ['cap cuu y te', 'cap cuu', '115']
  },
  {
    id: 'bv_dan_quan',
    label: 'Bảo vệ dân phố / Dân quân tự vệ',
    nameKey: 'ten_bv_dan_quan',
    phoneKey: 'sdt_bv_dan_quan',
    defaultStt: 4,
    matchPatterns: ['dan pho', 'dan quan tu ve', 'dan quan', 'tu ve']
  },
  {
    id: 'ca_khu_vuc',
    label: 'Công an khu vực',
    nameKey: 'ten_ca_khu_vuc',
    phoneKey: 'sdt_ca_khu_vuc',
    defaultStt: 5,
    matchPatterns: ['cong an khu vuc', 'ca khu vuc']
  },
  {
    id: 'ca_xa_phuong',
    label: 'Công an Xã/Phường',
    nameKey: 'ten_ca_xa_phuong',
    phoneKey: 'sdt_ca_xa_phuong',
    defaultStt: 6,
    matchPatterns: ['cong an xa', 'cong an phuong', 'ca xa', 'ca phuong']
  },
  {
    id: 'pccc_xa_phuong',
    label: 'PCCC Xã/Phường',
    nameKey: 'ten_pccc_xa_phuong',
    phoneKey: 'sdt_pccc_xa_phuong',
    defaultStt: 7,
    matchPatterns: ['pccc xa', 'pccc phuong']
  },
  {
    id: 'dien_luc',
    label: 'Điện lực khu vực',
    nameKey: 'ten_dien_luc',
    phoneKey: 'sdt_dien_luc',
    defaultStt: 8,
    matchPatterns: ['dien luc', 'dien luc khu vuc']
  },
  {
    id: 'giam_doc',
    label: 'Giám đốc Showroom',
    nameKey: 'ten_giam_doc',
    phoneKey: 'sdt_giam_doc',
    defaultStt: 9,
    matchPatterns: ['giam doc showroom', 'giam doc don vi', 'giam doc']
  },
  {
    id: 'ptkd_dvpt',
    label: 'Giám đốc / PT KD DVPT',
    nameKey: 'ten_ptkd_dvpt',
    phoneKey: 'sdt_ptkd_dvpt',
    defaultStt: 10,
    matchPatterns: ['ban hang dvpt', 'kinh doanh dvpt', 'dvpt', 'dich vu phu tung', 'ptkd dvpt']
  },
  {
    id: 'ptkd_xe',
    label: 'Giám đốc / PT KD Xe',
    nameKey: 'ten_ptkd_xe',
    phoneKey: 'sdt_ptkd_xe',
    defaultStt: 11,
    matchPatterns: ['ban hang xe', 'kinh doanh xe', 'kd xe', 'ptkd xe']
  },
  {
    id: 'kho_xe',
    label: 'Phụ trách Kho xe & Lái xe',
    nameKey: 'ten_kho_xe',
    phoneKey: 'sdt_kho_xe',
    defaultStt: 12,
    matchPatterns: ['kho xe', 'lai xe', 'phu trach kho xe']
  },
  {
    id: 'tt_bao_ve',
    label: 'Tổ trưởng bảo vệ, đón tiếp KH',
    nameKey: 'ten_tt_bao_ve',
    phoneKey: 'sdt_tt_bao_ve',
    defaultStt: 13,
    matchPatterns: ['to truong bao ve', 'don tiep khach hang', 'tt bao ve', 'don tiep kh']
  },
  {
    id: 'hc_ns',
    label: 'Phụ trách QTVP (Hành chính)',
    nameKey: 'ten_hc_ns',
    phoneKey: 'sdt_hc_ns',
    defaultStt: 14,
    matchPatterns: ['dich vu ho tro kd', 'ho tro kd', 'hanh chinh', 'vp cty', 'qtvp', 'hc ns']
  },
  {
    id: 'bv_lien_ket',
    label: 'Cơ sở y tế gần nhất (ký HĐ y tế)',
    nameKey: 'ten_bv_lien_ket',
    phoneKey: 'sdt_bv_lien_ket',
    defaultStt: 15,
    matchPatterns: ['hop dong y te', 'y te gan nhat', 'bv lien ket', 'co so y te gan nhat']
  }
];

// Làm sạch nội dung text (xóa thẻ ngoặc vuông, ghi chú liên kết trong ngoặc tròn)
export const cleanContactText = (val: string): string => {
  if (!val) return '';
  return val
    .replace(/\[\s*[\w_]+\s*\]/g, '') // Xóa các thẻ dạng [ten_ca_pccc] nếu có
    .replace(/\(liên kết với A.*?\)/gi, '') // Xóa ghi chú liên kết Mục A nếu có
    .replace(/\s+/g, ' ')
    .trim();
};

export const parseEmergencyContactsTable = (
  rawText: string,
  htmlText?: string
): ParseContactsResult => {
  const result: ParseContactsResult = {
    patch: {},
    rows: [],
    matchedCount: 0,
    skippedCount: 0
  };

  let rawRows: string[][] = [];

  // 1. Thử bóc tách từ HTML table (thường có khi copy trực tiếp từ PowerPoint hoặc Excel)
  if (htmlText && htmlText.includes('<table')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const trElements = Array.from(doc.querySelectorAll('tr'));
      if (trElements.length > 0) {
        rawRows = trElements.map(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th'));
          return cells.map(cell => (cell.textContent || '').trim());
        });
      }
    } catch {
      // Fallback về text nếu parse HTML lỗi
    }
  }

  // 2. Nếu chưa có dữ liệu từ HTML, phân tách theo text/plain (tab hoặc |)
  if (rawRows.length === 0 && rawText) {
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    rawRows = lines.map(line => {
      if (line.includes('\t')) {
        return line.split('\t').map(col => col.trim());
      }
      if (line.includes('|')) {
        return line.split('|').map(col => col.trim()).filter(Boolean);
      }
      // Tách theo 2 khoảng trắng liên tiếp
      return line.split(/\s{2,}/).map(col => col.trim());
    });
  }

  const assignedDefinitions = new Set<string>();

  rawRows.forEach(cells => {
    if (cells.length < 2) return;

    // Bỏ qua dòng tiêu đề
    const rowContentUnaccented = toUnaccented(cells.join(' '));
    if (
      rowContentUnaccented.includes('co quan') ||
      rowContentUnaccented.includes('bo phan') ||
      rowContentUnaccented.includes('so dien thoai') ||
      (rowContentUnaccented.includes('stt') && rowContentUnaccented.includes('ten'))
    ) {
      return;
    }

    // Phân tích cột: Xác định xem cột đầu tiên có phải là STT không
    let stt: number | undefined = undefined;
    let deptCol = '';
    let nameCol = '';
    let phoneCol = '';

    const firstColNumber = parseInt(cells[0], 10);
    if (!isNaN(firstColNumber) && /^\d+$/.test(cells[0].trim())) {
      // Dạng 5 cột chuẩn: STT | Cơ quan/Bộ phận | Tên | SĐT | Ghi chú
      stt = firstColNumber;
      deptCol = cells[1] || '';
      nameCol = cells[2] || '';
      phoneCol = cells[3] || '';
    } else {
      // Dạng 3-4 cột (không có cột STT): Cơ quan/Bộ phận | Tên | SĐT | Ghi chú
      deptCol = cells[0] || '';
      nameCol = cells[1] || '';
      phoneCol = cells[2] || '';
    }

    const deptUnaccented = toUnaccented(deptCol);
    const rawCleanName = cleanContactText(nameCol);
    const rawCleanPhone = cleanContactText(phoneCol);
    const formattedPhone = formatPhoneNumber(rawCleanPhone);

    // 🔴 BỎ QUA DÒNG 113 THEO YÊU CẦU
    if (
      stt === 1 ||
      deptUnaccented.includes('113') ||
      deptUnaccented.includes('phan ung nhanh') ||
      rawCleanPhone === '113'
    ) {
      result.rows.push({
        stt: 1,
        rawDept: deptCol || 'Cảnh sát Phản ứng nhanh (113)',
        matchedRole: 'Cảnh sát Phản ứng nhanh (113)',
        name: rawCleanName,
        phone: formattedPhone || '113',
        status: 'skipped',
        statusLabel: 'Bỏ qua (113)'
      });
      result.skippedCount++;
      return;
    }

    // Tìm kiếm định nghĩa khớp theo từ khóa
    let matchedDef: ContactDefinition | undefined = undefined;

    // Ưu tiên 1: Khớp theo từ khóa Cơ quan / Bộ phận
    for (const def of CONTACT_DEFINITIONS) {
      if (assignedDefinitions.has(def.id)) continue;
      const isMatch = def.matchPatterns.some(pattern => deptUnaccented.includes(pattern));
      if (isMatch) {
        matchedDef = def;
        break;
      }
    }

    // Ưu tiên 2: Khớp theo số STT nếu có
    if (!matchedDef && stt !== undefined) {
      matchedDef = CONTACT_DEFINITIONS.find(
        def => def.defaultStt === stt && !assignedDefinitions.has(def.id)
      );
    }

    if (matchedDef) {
      assignedDefinitions.add(matchedDef.id);

      if (rawCleanName) {
        result.patch[matchedDef.nameKey] = rawCleanName;
      }
      if (formattedPhone) {
        result.patch[matchedDef.phoneKey] = formattedPhone;
      }

      result.rows.push({
        stt: stt || matchedDef.defaultStt,
        rawDept: deptCol,
        matchedRole: matchedDef.label,
        name: rawCleanName,
        phone: formattedPhone,
        nameKey: matchedDef.nameKey,
        phoneKey: matchedDef.phoneKey,
        status: 'matched',
        statusLabel: 'Đã khớp trường'
      });
      result.matchedCount++;
    } else {
      // Không nhận diện được
      result.rows.push({
        stt,
        rawDept: deptCol,
        matchedRole: 'Chưa xác định',
        name: rawCleanName,
        phone: formattedPhone,
        status: 'unrecognized',
        statusLabel: 'Không nhận diện được'
      });
    }
  });

  return result;
};
