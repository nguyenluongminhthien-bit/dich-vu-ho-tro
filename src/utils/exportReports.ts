// src/utils/exportReports.ts
import { ReportTemplate } from '../constants/reportTemplates';

// Helper XML escape
const escapeXML = (str: any) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Chuẩn hóa tên Sheet
const getSanitizeSheetName = () => {
  const usedNames = new Set<string>();
  return (name: string) => {
    let cleanName = name.replace(/[\\\/?*:[\]]/g, '').trim().substring(0, 31);
    if (!cleanName) cleanName = "Sheet";
    let finalName = cleanName;
    let counter = 1;
    while (usedNames.has(finalName.toLowerCase())) {
      const suffix = ` (${counter})`;
      finalName = cleanName.substring(0, 31 - suffix.length) + suffix;
      counter++;
    }
    usedNames.add(finalName.toLowerCase());
    return finalName;
  };
};

// Định dạng dữ liệu
export const formatCell = (val: any, format?: string): string => {
  if (val === null || val === undefined || val === '') return '';
  if (format === 'date') {
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return d.toLocaleDateString('vi-VN');
    } catch {
      return String(val);
    }
  }
  if (format === 'currency') {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString('vi-VN');
  }
  if (format === 'boolean') {
    return val === true || String(val).toLowerCase() === 'true' || val === 1 ? 'Có' : 'Không';
  }
  if (format === 'phone') {
    // Định dạng số điện thoại hiển thị đẹp
    const clean = String(val).replace(/\D/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
    }
    return String(val);
  }
  return String(val);
};

// XML Style cho Báo cáo Excel 2003
const XML_STYLES = `
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="11"/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#05469B" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
   </Borders>
  </Style>
  <Style ss:ID="sData">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="sBold">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="sTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="16" ss:Bold="1" ss:Color="#05469B"/>
  </Style>
  <Style ss:ID="sSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="11" ss:Italic="1"/>
  </Style>
  <Style ss:ID="sMetaLabel">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1" ss:Color="#4B5563"/>
  </Style>
  <Style ss:ID="sMetaValue">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Color="#1F2937"/>
  </Style>
  <Style ss:ID="sDataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataBold">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataLink">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Color="#05469B" ss:Underline="Single"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
   </Borders>
  </Style>
   <Style ss:ID="sDataBoldCenter">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sSubHeader">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#002060"/>
    <Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    </Borders>
   </Style>
   <Style ss:ID="sSection">
    <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="12" ss:Bold="1" ss:Color="#05469B"/>
   </Style>
   <Style ss:ID="sTotalRow">
    <Alignment ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1" ss:Color="#002060"/>
    <Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    </Borders>
   </Style>
   <Style ss:ID="sTotalRowCenter">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1" ss:Color="#002060"/>
    <Interior ss:Color="#FFF2CC" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader1">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#9A3412"/>
    <Interior ss:Color="#FFEDD5" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader2">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#92400E"/>
    <Interior ss:Color="#FEF3C7" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader3">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#1E40AF"/>
    <Interior ss:Color="#DBEAFE" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader4">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#065F46"/>
    <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader5">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#3730A3"/>
    <Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
   <Style ss:ID="sGroupHeader6">
    <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
    <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="10" ss:Bold="1" ss:Color="#4B5563"/>
    <Interior ss:Color="#F3F4F6" ss:Pattern="Solid"/>
    <Borders>
     <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
     <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D1D5DB"/>
    </Borders>
   </Style>
  </Styles>
`;

// ==========================================
// HÀM TẠO SHEET THỐNG KÊ CHO BÁO CÁO NHÂN SỰ
// ==========================================
const renderPersonnelStatsSheetXML = (
  data: any[],
  donViList: any[] = [],
  donViMap: Record<string, string> = {},
  filters: Record<string, any> = {}
): string => {
  // CHỈ LẤY VÀ THỐNG KÊ DỮ LIỆU CB-NV CÓ TRẠNG THÁI LÀM VIỆC LÀ "Đang làm việc"
  const activeStaff = data.filter(p => String(p.trang_thai || '').trim() === 'Đang làm việc');
  const totalActive = activeStaff.length;

  // 1. CHỈ SỐ TỔNG QUAN
  const maleCount = activeStaff.filter(p => p.gioi_tinh === 'Nam').length;
  const femaleCount = activeStaff.filter(p => p.gioi_tinh === 'Nữ').length;
  const malePct = totalActive > 0 ? ((maleCount / totalActive) * 100).toFixed(1) : '0.0';
  const femalePct = totalActive > 0 ? ((femaleCount / totalActive) * 100).toFixed(1) : '0.0';

  // 2. BẢNG 1: THEO ĐƠN VỊ / SHOWROOM
  const unitStatsMap: Record<string, { name: string; total: number; male: number; female: number }> = {};
  activeStaff.forEach(p => {
    const uId = String(p.id_don_vi || '').trim();
    const uName = p.showroom || donViMap[uId] || uId || 'Không xác định';
    if (!unitStatsMap[uId]) {
      unitStatsMap[uId] = { name: uName, total: 0, male: 0, female: 0 };
    }
    unitStatsMap[uId].total++;
    if (p.gioi_tinh === 'Nam') unitStatsMap[uId].male++;
    else if (p.gioi_tinh === 'Nữ') unitStatsMap[uId].female++;
  });
  const unitList = Object.values(unitStatsMap).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  // 3. BẢNG 2: THEO PHÒNG BAN / BỘ PHẬN
  const deptStatsMap: Record<string, { name: string; total: number; male: number; female: number }> = {};
  activeStaff.forEach(p => {
    const pb = String(p.phong_ban || '').trim() || 'Chưa phân bổ';
    if (!deptStatsMap[pb]) {
      deptStatsMap[pb] = { name: pb, total: 0, male: 0, female: 0 };
    }
    deptStatsMap[pb].total++;
    if (p.gioi_tinh === 'Nam') deptStatsMap[pb].male++;
    else if (p.gioi_tinh === 'Nữ') deptStatsMap[pb].female++;
  });
  const deptList = Object.values(deptStatsMap).sort((a, b) => {
    const getPriority = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('lãnh đạo') || lower.includes('giám đốc')) return 1;
      if (lower.includes('kinh doanh xe') || lower.includes('kd xe')) return 2;
      if (lower.includes('dịch vụ') || lower.includes('xưởng')) return 3;
      if (lower.includes('kế toán')) return 4;
      if (lower.includes('văn phòng') || lower.includes('qtvp') || lower.includes('hành chính')) return 5;
      if (lower === 'chưa phân bổ') return 99;
      return 10;
    };
    const pA = getPriority(a.name);
    const pB = getPriority(b.name);
    if (pA !== pB) return pA - pB;
    return a.name.localeCompare(b.name, 'vi');
  });

  // 4. BẢNG 3: BẢO VỆ & PHỤC VỤ HẬU CẦN (crossTabStats)
  const bvUnitStats: Record<string, { name: string; bv_nv: number; bv_tt_tp: number; pvhc_nv: number; pvhc_tt_tp: number }> = {};
  unitList.forEach(u => {
    bvUnitStats[u.name] = { name: u.name, bv_nv: 0, bv_tt_tp: 0, pvhc_nv: 0, pvhc_tt_tp: 0 };
  });

  activeStaff.forEach(p => {
    const uId = String(p.id_don_vi || '').trim();
    const uName = p.showroom || donViMap[uId] || uId || 'Không xác định';
    if (!bvUnitStats[uName]) {
      bvUnitStats[uName] = { name: uName, bv_nv: 0, bv_tt_tp: 0, pvhc_nv: 0, pvhc_tt_tp: 0 };
    }

    const bp = String(p.phong_ban || '').trim().toLowerCase().normalize('NFC').replace(/\s+/g, ' ');
    const cd = String(p.chuc_danh || '').trim().toLowerCase().normalize('NFC');
    const cv = String(p.chuc_vu || '').trim().toLowerCase().normalize('NFC');

    // Điều kiện nghiêm ngặt: Phòng Ban / Bộ phận phải là BV,ĐTKH hoặc PVHC
    const isBVDept = 
      bp === 'bv, đtkh' || 
      bp === 'bv,đtkh' || 
      bp === 'bv - đtkh' || 
      bp === 'bv-đtkh' || 
      bp.startsWith('bv, đtkh') || 
      bp.startsWith('bv,đtkh') || 
      bp.includes('bv, đtkh') || 
      bp.includes('bv,đtkh') || 
      bp.includes('bảo vệ, đón tiếp') || 
      bp.includes('bảo vệ & đón tiếp') ||
      bp.includes('bảo vệ và đón tiếp');

    const isPVHCDept = 
      bp === 'pvhc' || 
      bp.startsWith('pvhc') || 
      bp.includes('pvhc') || 
      bp.includes('phục vụ hậu cần') || 
      bp.includes('phục vụ - hậu cần') ||
      bp.includes('phục vụ & hậu cần');

    // Chức danh tương ứng để phân loại
    const isLead = 
      cd.includes('tổ trưởng') || cd.includes('tổ phó') || cd.includes('trưởng nhóm') ||
      cv.includes('tổ trưởng') || cv.includes('tổ phó') || cv.includes('trưởng nhóm');

    if (isBVDept) {
      if (isLead) {
        bvUnitStats[uName].bv_tt_tp++;
      } else {
        bvUnitStats[uName].bv_nv++;
      }
    } else if (isPVHCDept) {
      if (isLead) {
        bvUnitStats[uName].pvhc_tt_tp++;
      } else {
        bvUnitStats[uName].pvhc_nv++;
      }
    }
  });

  const bvList = Object.values(bvUnitStats);
  let totalBvNv = 0, totalBvTtTp = 0, totalPvhcNv = 0, totalPvhcTtTp = 0;
  bvList.forEach(item => {
    totalBvNv += item.bv_nv;
    totalBvTtTp += item.bv_tt_tp;
    totalPvhcNv += item.pvhc_nv;
    totalPvhcTtTp += item.pvhc_tt_tp;
  });

  // 5. BẢNG 4: BỘ PHẬN VÀ CẤP BẬC (deptTabStats)
  const phanLoaiSet = new Set<string>();
  const matrixDeptMap: Record<string, Record<string, number>> = {};

  activeStaff.forEach(p => {
    const pb = String(p.phong_ban || '').trim() || 'Chưa phân bổ';
    const pl = String(p.chuc_danh || '').trim() || 'Chưa phân loại';
    phanLoaiSet.add(pl);

    if (!matrixDeptMap[pb]) matrixDeptMap[pb] = { total: 0 };
    if (!matrixDeptMap[pb][pl]) matrixDeptMap[pb][pl] = 0;
    matrixDeptMap[pb][pl]++;
    matrixDeptMap[pb].total++;
  });

  const rawGroups = [
    { id: 'quan_ly', label: 'CẤP QUẢN LÝ', styleId: 'sGroupHeader1', roles: ['Lãnh đạo', 'Chủ tịch', 'Tổng Giám đốc', 'Phó Tổng Giám đốc', 'Giám đốc', 'Phó Giám đốc', 'Trưởng phòng', 'Trưởng bộ phận', 'Phó phòng'] },
    { id: 'giam_sat', label: 'CẤP GIÁM SÁT', styleId: 'sGroupHeader2', roles: ['Trợ lý', 'Trưởng nhóm', 'Tổ trưởng', 'Tổ phó'] },
    { id: 'chuyen_vien', label: 'CHUYÊN MÔN', styleId: 'sGroupHeader3', roles: ['Chuyên viên'] },
    { id: 'ho_tro', label: 'DỊCH VỤ HỖ TRỢ', styleId: 'sGroupHeader4', roles: ['PT DVHT KD', 'PT DVHC', 'PT NS', 'BV, ĐTKH'] },
    { id: 'nhan_vien', label: 'NGHIỆP VỤ', styleId: 'sGroupHeader5', roles: ['Nhân viên'] },
    { id: 'khac', label: 'KHÁC', styleId: 'sGroupHeader6', roles: ['Chưa phân loại'] }
  ];

  const knownRoles = new Set(rawGroups.flatMap(g => g.roles));
  phanLoaiSet.forEach(pl => {
    if (!knownRoles.has(pl)) {
      rawGroups[rawGroups.length - 1].roles.push(pl);
    }
  });

  const activeGroups = rawGroups.map(g => ({
    ...g,
    activeRoles: g.roles.filter(r => phanLoaiSet.has(r))
  })).filter(g => g.activeRoles.length > 0);

  const matrixDeptRows = Object.keys(matrixDeptMap).sort((a, b) => {
    const getPriority = (name: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('lãnh đạo') || lower.includes('giám đốc')) return 1;
      if (lower === 'chưa phân bổ') return 99;
      return 2;
    };
    const pA = getPriority(a);
    const pB = getPriority(b);
    if (pA !== pB) return pA - pB;
    return a.localeCompare(b, 'vi');
  });

  const matrixColTotals: Record<string, number> = {};
  activeGroups.forEach(g => {
    g.activeRoles.forEach(r => {
      matrixColTotals[r] = 0;
    });
  });
  matrixDeptRows.forEach(r => {
    activeGroups.forEach(g => {
      g.activeRoles.forEach(c => {
        matrixColTotals[c] = (matrixColTotals[c] || 0) + (matrixDeptMap[r][c] || 0);
      });
    });
  });

  // 6. BẢNG 5: ĐỘ TUỔI & THÂM NIÊN
  const currentYear = new Date().getFullYear();
  const ageStats = { under25: 0, from25to35: 0, from36to45: 0, over45: 0, unknown: 0 };
  const seniorityStats = { under1Year: 0, from1to3Years: 0, from3to5Years: 0, over5Years: 0, unknown: 0 };

  activeStaff.forEach(p => {
    if (p.nam_sinh) {
      const d = new Date(p.nam_sinh);
      const y = !isNaN(d.getFullYear()) ? d.getFullYear() : parseInt(String(p.nam_sinh).slice(0, 4), 10);
      if (y && y > 1900 && y <= currentYear) {
        const age = currentYear - y;
        if (age < 25) ageStats.under25++;
        else if (age <= 35) ageStats.from25to35++;
        else if (age <= 45) ageStats.from36to45++;
        else ageStats.over45++;
      } else {
        ageStats.unknown++;
      }
    } else {
      ageStats.unknown++;
    }

    if (p.ngay_nhan_vien) {
      const d = new Date(p.ngay_nhan_vien);
      if (!isNaN(d.getTime())) {
        const years = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
        if (years < 1) seniorityStats.under1Year++;
        else if (years < 3) seniorityStats.from1to3Years++;
        else if (years < 5) seniorityStats.from3to5Years++;
        else seniorityStats.over5Years++;
      } else {
        seniorityStats.unknown++;
      }
    } else {
      seniorityStats.unknown++;
    }
  });

  const totalMatrixRoles = activeGroups.reduce((acc, g) => acc + g.activeRoles.length, 0);
  const maxColsAcross = Math.max(10, totalMatrixRoles + 4);

  // BẮT ĐẦU SINH XML CHO WORKSHEET THỐNG KÊ
  let xml = ` <Worksheet ss:Name="${escapeXML('Thống kê')}">\n  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="95">\n`;
  xml += `   <Column ss:Width="50"/>\n`;
  xml += `   <Column ss:Width="160"/>\n`;
  xml += `   <Column ss:Width="120"/>\n`;
  for (let c = 4; c <= maxColsAcross; c++) {
    xml += `   <Column ss:Width="95"/>\n`;
  }

  // TIÊU ĐỀ CHÍNH
  xml += `   <Row ss:Height="36">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sTitle"><Data ss:Type="String">BÁO CÁO THỐNG KÊ NHÂN SỰ THEO ĐƠN VỊ</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="20">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSubtitle"><Data ss:Type="String">Thời điểm xuất: ${escapeXML(new Date().toLocaleString('vi-VN'))} - Dữ liệu: CBNV hiện đang làm việc</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="14"><Cell></Cell></Row>\n`;

  // KHỐI I: KPI
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">I. CHỈ SỐ TỔNG QUAN CHUNG (CBNV ĐANG LÀM VIỆC)</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="24">\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">TT</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">Chỉ tiêu thống kê</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Số lượng (Người)</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Tỷ lệ (%)</Data></Cell>\n`;
  xml += `   </Row>\n`;

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">1</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sDataBold"><Data ss:Type="String">Tổng số CBNV đang làm việc</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataBoldCenter"><Data ss:Type="String">100.0%</Data></Cell>\n`;
  xml += `   </Row>\n`;

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">2</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sData"><Data ss:Type="String">- Giới tính: Nam</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataCenter"><Data ss:Type="Number">${maleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataCenter"><Data ss:Type="String">${malePct}%</Data></Cell>\n`;
  xml += `   </Row>\n`;

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">3</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sData"><Data ss:Type="String">- Giới tính: Nữ</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataCenter"><Data ss:Type="Number">${femaleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sDataCenter"><Data ss:Type="String">${femalePct}%</Data></Cell>\n`;
  xml += `   </Row>\n`;
  xml += `   <Row ss:Height="15"><Cell></Cell></Row>\n`;

  // BẢNG 1: THEO ĐƠN VỊ / SHOWROOM
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">II. THỐNG KÊ NHÂN SỰ THEO ĐƠN VỊ / SHOWROOM</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="24">\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Đơn vị / Showroom</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tổng CBNV</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nam</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nữ</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tỷ lệ %</Data></Cell>\n`;
  xml += `   </Row>\n`;

  unitList.forEach((u, idx) => {
    const pct = totalActive > 0 ? ((u.total / totalActive) * 100).toFixed(1) : '0.0';
    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(u.name)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${u.total}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${u.male}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${u.female}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${pct}%</Data></Cell>\n`;
    xml += `   </Row>\n`;
  });

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String"></Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${maleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${femaleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String">100.0%</Data></Cell>\n`;
  xml += `   </Row>\n`;
  xml += `   <Row ss:Height="15"><Cell></Cell></Row>\n`;

  // BẢNG 2: THEO PHÒNG BAN / BỘ PHẬN
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">III. THỐNG KÊ NHÂN SỰ THEO PHÒNG BAN / BỘ PHẬN</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="24">\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Phòng Ban / Bộ Phận</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tổng số</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nam</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nữ</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tỷ lệ %</Data></Cell>\n`;
  xml += `   </Row>\n`;

  deptList.forEach((d, idx) => {
    const pct = totalActive > 0 ? ((d.total / totalActive) * 100).toFixed(1) : '0.0';
    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(d.name)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${d.total}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${d.male}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${d.female}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${pct}%</Data></Cell>\n`;
    xml += `   </Row>\n`;
  });

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String"></Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${maleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${femaleCount}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String">100.0%</Data></Cell>\n`;
  xml += `   </Row>\n`;
  xml += `   <Row ss:Height="15"><Cell></Cell></Row>\n`;

  // BẢNG 3: BẢO VỆ, ĐÓN TIẾP KH & PHỤC VỤ HẬU CẦN
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">IV. THỐNG KÊ BẢO VỆ, ĐÓN TIẾP KHÁCH HÀNG &amp; PHỤC VỤ HẬU CẦN</Data></Cell>\n   </Row>\n`;
  // Header Dòng 1
  xml += `   <Row ss:Height="24">\n`;
  xml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
  xml += `    <Cell ss:MergeDown="1" ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">BỘ PHẬN / ĐƠN VỊ</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">BV, ĐÓN TIẾP KH</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">PV HẬU CẦN</Data></Cell>\n`;
  xml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `   </Row>\n`;
  // Header Dòng 2
  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:Index="4" ss:StyleID="sSubHeader"><Data ss:Type="String">NV</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">T.Trưởng/Phó</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">Cộng BV</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">NV</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">T.Trưởng/Phó</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">Cộng HC</Data></Cell>\n`;
  xml += `   </Row>\n`;

  if (bvList.length === 0) {
    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">-</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="8" ss:StyleID="sDataCenter"><Data ss:Type="String">(Không có dữ liệu)</Data></Cell>\n`;
    xml += `   </Row>\n`;
  } else {
    bvList.forEach((b, idx) => {
      const congBv = b.bv_nv + b.bv_tt_tp;
      const congHc = b.pvhc_nv + b.pvhc_tt_tp;
      const tongRow = congBv + congHc;
      xml += `   <Row ss:Height="22">\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>\n`;
      xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(b.name)}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${b.bv_nv}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${b.bv_tt_tp}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${congBv}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${b.pvhc_nv}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${b.pvhc_tt_tp}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${congHc}</Data></Cell>\n`;
      xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${tongRow}</Data></Cell>\n`;
      xml += `   </Row>\n`;
    });
  }

  const grandCongBv = totalBvNv + totalBvTtTp;
  const grandCongHc = totalPvhcNv + totalPvhcTtTp;
  const grandTotalBvPvhc = grandCongBv + grandCongHc;
  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String"></Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalBvNv}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalBvTtTp}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${grandCongBv}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalPvhcNv}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalPvhcTtTp}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${grandCongHc}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${grandTotalBvPvhc}</Data></Cell>\n`;
  xml += `   </Row>\n`;
  xml += `   <Row ss:Height="15"><Cell></Cell></Row>\n`;

  // BẢNG 4: BỘ PHẬN VÀ CẤP BẬC
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">V. TỔNG HỢP NHÂN SỰ THEO BỘ PHẬN VÀ CẤP BẬC</Data></Cell>\n   </Row>\n`;
  
  if (activeGroups.length === 0) {
    // Khi không có nhóm cấp bậc nào (dữ liệu rỗng), xuất 1 dòng header duy nhất
    xml += `   <Row ss:Height="26">\n`;
    xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">BỘ PHẬN</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
    xml += `   </Row>\n`;
  } else {
    // Header Dòng 1
    xml += `   <Row ss:Height="26">\n`;
    xml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
    xml += `    <Cell ss:MergeDown="1" ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">BỘ PHẬN</Data></Cell>\n`;
    activeGroups.forEach(g => {
      const span = g.activeRoles.length - 1;
      const mergeAttr = span > 0 ? ` ss:MergeAcross="${span}"` : '';
      xml += `    <Cell${mergeAttr} ss:StyleID="${g.styleId}"><Data ss:Type="String">${escapeXML(g.label)}</Data></Cell>\n`;
    });
    xml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
    xml += `   </Row>\n`;

    // Header Dòng 2
    xml += `   <Row ss:Height="24">\n`;
    let isFirstRole = true;
    activeGroups.forEach(g => {
      g.activeRoles.forEach(r => {
        if (isFirstRole) {
          xml += `    <Cell ss:Index="4" ss:StyleID="sSubHeader"><Data ss:Type="String">${escapeXML(r)}</Data></Cell>\n`;
          isFirstRole = false;
        } else {
          xml += `    <Cell ss:StyleID="sSubHeader"><Data ss:Type="String">${escapeXML(r)}</Data></Cell>\n`;
        }
      });
    });
    xml += `   </Row>\n`;
  }

  // Các dòng Bộ phận
  if (matrixDeptRows.length === 0) {
    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">-</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="${activeGroups.length > 0 ? totalMatrixRoles + 2 : 2}" ss:StyleID="sDataCenter"><Data ss:Type="String">(Không có dữ liệu)</Data></Cell>\n`;
    xml += `   </Row>\n`;
  } else {
    matrixDeptRows.forEach((r, idx) => {
      xml += `   <Row ss:Height="22">\n`;
      xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>\n`;
      xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(r)}</Data></Cell>\n`;
      activeGroups.forEach(g => {
        g.activeRoles.forEach(c => {
          const val = matrixDeptMap[r][c] || 0;
          xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${val}</Data></Cell>\n`;
        });
      });
      xml += `    <Cell ss:StyleID="sDataBoldCenter"><Data ss:Type="Number">${matrixDeptMap[r].total}</Data></Cell>\n`;
      xml += `   </Row>\n`;
    });
  }

  // Dòng TỔNG CỘNG Bảng 4
  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String"></Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  activeGroups.forEach(g => {
    g.activeRoles.forEach(c => {
      xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${matrixColTotals[c] || 0}</Data></Cell>\n`;
    });
  });
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `   </Row>\n`;
  xml += `   <Row ss:Height="15"><Cell></Cell></Row>\n`;

  // BẢNG 5: ĐỘ TUỔI & THÂM NIÊN
  xml += `   <Row ss:Height="24">\n    <Cell ss:MergeAcross="${maxColsAcross - 1}" ss:StyleID="sSection"><Data ss:Type="String">VI. THỐNG KÊ THEO ĐỘ TUỔI &amp; THÂM NIÊN LÀM VIỆC</Data></Cell>\n   </Row>\n`;
  xml += `   <Row ss:Height="24">\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">STT</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Nhóm Độ tuổi</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Số lượng</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tỷ lệ %</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sHeader"><Data ss:Type="String">Nhóm Thâm niên</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Số lượng</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tỷ lệ %</Data></Cell>\n`;
  xml += `   </Row>\n`;

  const ageRows = [
    { label: 'Dưới 25 tuổi', count: ageStats.under25 },
    { label: 'Từ 25 đến 35 tuổi', count: ageStats.from25to35 },
    { label: 'Từ 36 đến 45 tuổi', count: ageStats.from36to45 },
    { label: 'Trên 45 tuổi', count: ageStats.over45 },
    { label: 'Chưa rõ năm sinh', count: ageStats.unknown }
  ];

  const senRows = [
    { label: 'Dưới 1 năm', count: seniorityStats.under1Year },
    { label: 'Từ 1 đến 3 năm', count: seniorityStats.from1to3Years },
    { label: 'Từ 3 đến 5 năm', count: seniorityStats.from3to5Years },
    { label: 'Trên 5 năm', count: seniorityStats.over5Years },
    { label: 'Chưa rõ ngày vào', count: seniorityStats.unknown }
  ];

  for (let i = 0; i < ageRows.length; i++) {
    const a = ageRows[i];
    const s = senRows[i];
    const aPct = totalActive > 0 ? ((a.count / totalActive) * 100).toFixed(1) : '0.0';
    const sPct = totalActive > 0 ? ((s.count / totalActive) * 100).toFixed(1) : '0.0';
    xml += `   <Row ss:Height="22">\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${i + 1}</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(a.label)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${a.count}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${aPct}%</Data></Cell>\n`;
    xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sData"><Data ss:Type="String">${escapeXML(s.label)}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${s.count}</Data></Cell>\n`;
    xml += `    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${sPct}%</Data></Cell>\n`;
    xml += `   </Row>\n`;
  }

  xml += `   <Row ss:Height="22">\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String"></Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String">100.0%</Data></Cell>\n`;
  xml += `    <Cell ss:MergeAcross="1" ss:StyleID="sTotalRow"><Data ss:Type="String">TỔNG CỘNG</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="Number">${totalActive}</Data></Cell>\n`;
  xml += `    <Cell ss:StyleID="sTotalRowCenter"><Data ss:Type="String">100.0%</Data></Cell>\n`;
  xml += `   </Row>\n`;

  xml += `  </Table>\n </Worksheet>\n`;
  return xml;
};

export async function exportReportToExcel(
  template: ReportTemplate,
  data: any[],
  visibleColumns: string[],
  filters: Record<string, any>,
  donViMap: Record<string, string>,
  user: any,
  donViList?: any[]
): Promise<void> {
  const sanitizeSheetName = getSanitizeSheetName();

  let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${XML_STYLES}`;

  const renderTableXML = (sheetName: string, headers: string[], colsWidth: number[], rows: string[][], titleText?: string) => {
    let sheetXml = ` <Worksheet ss:Name="${escapeXML(sanitizeSheetName(sheetName))}">\n  <Table x:FullColumns="1" x:FullRows="1">\n`;
    colsWidth.forEach(w => {
      sheetXml += `   <Column ss:Width="${w}"/>\n`;
    });

    let currentLine = 1;
    if (titleText) {
      sheetXml += `   <Row ss:Height="40">\n    <Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="sTitle"><Data ss:Type="String">${escapeXML(titleText)}</Data></Cell>\n   </Row>\n`;
      sheetXml += `   <Row ss:Height="15"><Cell ss:MergeAcross="${headers.length - 1}"></Cell></Row>\n`;
      currentLine += 2;
    }

    // Headers
    sheetXml += `   <Row ss:Height="26">\n`;
    headers.forEach(h => {
      sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>\n`;
    });
    sheetXml += `   </Row>\n`;

    // Data rows
    rows.forEach(row => {
      sheetXml += `   <Row ss:Height="22" ss:AutoFitHeight="1">\n`;
      row.forEach(cell => {
        sheetXml += `    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(cell)}</Data></Cell>\n`;
      });
      sheetXml += `   </Row>\n`;
    });

    sheetXml += `  </Table>\n </Worksheet>\n`;
    return sheetXml;
  };

  const cols = template.columns.filter(c => visibleColumns.includes(c.key));
  const headers = cols.map(c => c.label);
  const colsWidth = cols.map(c => c.width || 120);

  // XỬ LÝ ĐẶC BIỆT THEO LOẠI BÁO CÁO (Mỗi loại văn bản là 1 sheet Excel)
  if (template.id === 'document_list_report' || template.id === 'custom_report_documents') {
    // Hàm xác định loại văn bản/sheet theo phan_loai hoặc mã nhận biết (CVĐ / CV)
    const getDocumentSheetType = (item: any): string => {
      const pl = String(item.phan_loai || '').trim();
      if (pl === 'Quyết định' || pl === 'Thông báo' || pl === 'Thông báo BĐH' || pl === 'Tờ trình' || pl === 'Công văn đến' || pl === 'Công văn đi') {
        return pl;
      }
      const soHieu = String(item.so_hieu || '').toUpperCase();
      if (soHieu.includes('CVĐ') || soHieu.includes('/CVĐ') || pl.toLowerCase().includes('đến')) {
        return 'Công văn đến';
      }
      if (soHieu.includes('CV') || soHieu.includes('/CV') || pl.toLowerCase().includes('công văn')) {
        return 'Công văn đi';
      }
      return pl || 'Công văn đi';
    };

    // 1. Phân chia ra các sheet theo loại văn bản (Quyết định, Thông báo, Thông báo BĐH, Tờ trình, Công văn đến, Công văn đi...)
    const foundTypes = Array.from(new Set(data.map(item => getDocumentSheetType(item)))).filter(Boolean);
    const standardTypes = ['Quyết định', 'Thông báo', 'Thông báo BĐH', 'Tờ trình', 'Công văn đến', 'Công văn đi'];
    const types = foundTypes.length > 0 ? foundTypes : standardTypes;
    
    types.forEach(type => {
      const typeData = data.filter(item => getDocumentSheetType(item).toLowerCase() === type.toLowerCase());
      const rows = typeData.map(item =>
        cols.map(c => {
          let val = item[c.key];
          if (c.key === 'id_don_vi') val = donViMap[String(val)] || val;
          return formatCell(val, c.format);
        })
      );
      xmlContent += renderTableXML(type, headers, colsWidth, rows, `DANH SÁCH VĂN BẢN - ${type.toUpperCase()}`);
    });

    // 2. Bổ sung Sheet "Thống kê Bộ phận"
    const deptRows: string[][] = [];
    const depts = Array.from(new Set(data.map(item => item.bo_phan_lay_so || 'Không xác định')));
    
    depts.forEach(deptName => {
      const deptData = data.filter(item => (item.bo_phan_lay_so || 'Không xác định') === deptName);
      const qdCount = deptData.filter(item => getDocumentSheetType(item) === 'Quyết định').length;
      const tbCount = deptData.filter(item => getDocumentSheetType(item) === 'Thông báo').length;
      const tbBdhCount = deptData.filter(item => getDocumentSheetType(item) === 'Thông báo BĐH').length;
      const ttCount = deptData.filter(item => getDocumentSheetType(item) === 'Tờ trình').length;
      const cvdCount = deptData.filter(item => getDocumentSheetType(item) === 'Công văn đến').length;
      const cvDiCount = deptData.filter(item => getDocumentSheetType(item) === 'Công văn đi').length;
      
      deptRows.push([
        deptName,
        String(qdCount),
        String(tbCount),
        String(tbBdhCount),
        String(ttCount),
        String(cvdCount),
        String(cvDiCount),
        String(deptData.length)
      ]);
    });

    const statHeaders = ['Bộ phận lấy số', 'Quyết định', 'Thông báo', 'Thông báo BĐH', 'Tờ trình', 'Công văn đến (CVĐ)', 'Công văn đi (CV)', 'Tổng cộng'];
    const statWidths = [240, 120, 120, 150, 120, 150, 150, 110];
    xmlContent += renderTableXML('Thống kê Bộ phận', statHeaders, statWidths, deptRows, 'THỐNG KÊ SỐ LƯỢNG VĂN BẢN BAN HÀNH THEO BỘ PHẬN LẤY SỐ');

  } else if (template.id === 'policy_list_report') {
    // Sắp xếp theo Nghiệp vụ (A-Z) và Ngày ban hành (mới đến cũ) tương tự PolicyPage.tsx
    const sortedData = [...data].sort((a, b) => {
      const nvA = a.nghiep_vu || '';
      const nvB = b.nghiep_vu || '';
      const compNv = nvA.localeCompare(nvB, 'vi', { sensitivity: 'base' });
      if (compNv !== 0) return compNv;

      const dateA = a.ngay_ban_hanh ? new Date(a.ngay_ban_hanh).getTime() : 0;
      const dateB = b.ngay_ban_hanh ? new Date(b.ngay_ban_hanh).getTime() : 0;
      return dateB - dateA;
    });

    const rows = sortedData.map((item, idx) => {
      const formattedDate = item.ngay_ban_hanh 
        ? new Date(item.ngay_ban_hanh).toLocaleDateString('vi-VN') 
        : '';

      return `
   <Row ss:Height="22" ss:AutoFitHeight="1">
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="sDataBold"><Data ss:Type="String">${escapeXML(item.so_hieu || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(item.tieu_de || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(item.noi_dung || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(item.nghiep_vu || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(item.bo_phan_lay_so || '')}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${escapeXML(formattedDate)}</Data></Cell>
    <Cell ss:StyleID="sDataLink"${item.link_vb ? ` ss:HRef="${escapeXML(item.link_vb)}"` : ''}><Data ss:Type="String">${item.link_vb ? 'Link' : ''}</Data></Cell>
   </Row>\n`;
    }).join('');

    let sheetXml = ` <Worksheet ss:Name="Danh sách">\n  <Table x:FullColumns="1" x:FullRows="1">\n`;
    const widths = [50, 150, 250, 350, 150, 180, 120, 100];
    widths.forEach(w => {
      sheetXml += `   <Column ss:Width="${w}"/>\n`;
    });

    // Dòng Tiêu đề báo cáo gộp ô
    sheetXml += `   <Row ss:Height="40">\n    <Cell ss:MergeAcross="7" ss:StyleID="sTitle"><Data ss:Type="String">DANH SÁCH QUY ĐỊNH &amp; QUY TRÌNH</Data></Cell>\n   </Row>\n`;
    sheetXml += `   <Row ss:Height="15"><Cell ss:MergeAcross="7"></Cell></Row>\n`;

    // Headers
    sheetXml += `   <Row ss:Height="26">\n`;
    const headersList = ['STT', 'Số hiệu', 'Nội dung (tiêu đề)', 'Trích yếu', 'Nghiệp vụ', 'Bộ phận ban hành', 'Ngày ban hành', 'Đính kèm'];
    headersList.forEach(h => {
      sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">${escapeXML(h)}</Data></Cell>\n`;
    });
    sheetXml += `   </Row>\n`;

    sheetXml += rows;
    sheetXml += `  </Table>\n </Worksheet>\n`;
    xmlContent += sheetXml;

  } else if (template.id === 'system_donvi_structure') {
    // Layout xuất Excel có tiêu đề 2 dòng gộp ô chuyên nghiệp
    let sheetXml = ` <Worksheet ss:Name="${escapeXML(sanitizeSheetName('Tổng hợp liên hệ'))}">\n  <Table x:FullColumns="1" x:FullRows="1">\n`;
    colsWidth.forEach(w => {
      sheetXml += `   <Column ss:Width="${w}"/>\n`;
    });

    // Dòng Tiêu đề báo cáo gộp ô
    sheetXml += `   <Row ss:Height="40">\n    <Cell ss:MergeAcross="13" ss:StyleID="sTitle"><Data ss:Type="String">TỔNG HỢP THÔNG TIN LIÊN HỆ ĐƠN VỊ</Data></Cell>\n   </Row>\n`;
    sheetXml += `   <Row ss:Height="15"><Cell ss:MergeAcross="13"></Cell></Row>\n`;

    // Header Dòng 1
    sheetXml += `   <Row ss:Height="26">\n`;
    sheetXml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">TT</Data></Cell>\n`;
    sheetXml += `    <Cell ss:MergeDown="1" ss:StyleID="sHeader"><Data ss:Type="String">Tên Đơn vị</Data></Cell>\n`;
    sheetXml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">Tổng Giám đốc</Data></Cell>\n`;
    sheetXml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">PT QTVP &amp; ASĐS</Data></Cell>\n`;
    sheetXml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">PT DVHC</Data></Cell>\n`;
    sheetXml += `    <Cell ss:MergeAcross="2" ss:StyleID="sHeader"><Data ss:Type="String">PT Nhân sự</Data></Cell>\n`;
    sheetXml += `   </Row>\n`;

    // Header Dòng 2
    sheetXml += `   <Row ss:Height="22">\n`;
    sheetXml += `    <Cell ss:Index="3" ss:StyleID="sHeader"><Data ss:Type="String">Họ tên</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Mail</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">SĐT</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Họ tên</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Mail</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">SĐT</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Họ tên</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Mail</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">SĐT</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Họ tên</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Mail</Data></Cell>\n`;
    sheetXml += `    <Cell ss:StyleID="sHeader"><Data ss:Type="String">SĐT</Data></Cell>\n`;
    sheetXml += `   </Row>\n`;

    // Các dòng dữ liệu
    const rows = data.map(item =>
      cols.map(c => {
        let val = item[c.key];
        if (c.key === 'id_don_vi') val = donViMap[String(val)] || val;
        return formatCell(val, c.format);
      })
    );
    rows.forEach(row => {
      sheetXml += `   <Row ss:Height="22" ss:AutoFitHeight="1">\n`;
      row.forEach(cell => {
        sheetXml += `    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(cell)}</Data></Cell>\n`;
      });
      sheetXml += `   </Row>\n`;
    });

    sheetXml += `  </Table>\n </Worksheet>\n`;
    xmlContent += sheetXml;

  } else if (template.id === 'personnel_by_unit') {
    // XUẤT CHO MẪU "Danh sách Nhân sự theo Đơn vị"
    // Chỉ xuất và thống kê dữ liệu CB-NV có trạng thái làm việc là "Đang làm việc"
    const activeStaffData = data.filter(p => String(p.trang_thai || '').trim() === 'Đang làm việc');

    // 1. SHEET THỐNG KÊ (Dựa trên tập dữ liệu CBNV đang làm việc)
    xmlContent += renderPersonnelStatsSheetXML(activeStaffData, donViList, donViMap, filters);

    // 2. SHEET DỮ LIỆU (Chi tiết CBNV đang làm việc, bao gồm cột Chức Danh, Showroom & Đơn vị quản lý)
    const titleSuffix = filters.sub_report_type ? ` - ${filters.sub_report_type}` : '';
    const rows = activeStaffData.map(item =>
      cols.map(c => {
        let val = item[c.key];
        if (c.key === 'id_don_vi') val = donViMap[String(val)] || val;
        return formatCell(val, c.format);
      })
    );
    xmlContent += renderTableXML('Dữ liệu', headers, colsWidth, rows, (template.title + titleSuffix).toUpperCase());

  } else {
    // Các báo cáo còn lại xuất dạng bảng Dữ liệu chuẩn
    const titleSuffix = filters.sub_report_type ? ` - ${filters.sub_report_type}` : '';
    const rows = data.map(item =>
      cols.map(c => {
        let val = item[c.key];
        if (c.key === 'id_don_vi') val = donViMap[String(val)] || val;
        return formatCell(val, c.format);
      })
    );
    xmlContent += renderTableXML('Dữ liệu', headers, colsWidth, rows, (template.title + titleSuffix).toUpperCase());
  }

  // SHEET 3: THÔNG TIN BÁO CÁO (Metadata)
  const metaTitle = template.title + (filters.sub_report_type ? ` - ${filters.sub_report_type}` : '');
  xmlContent += ` <Worksheet ss:Name="Thông tin">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="150">
   <Column ss:Width="200"/>
   <Column ss:Width="300"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Tên Báo Cáo</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(metaTitle)}</Data></Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Phân Hệ</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(template.module)}</Data></Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Người Xuất Báo Cáo</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(user?.ho_ten || 'Admin')}</Data></Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Thời Gian Xuất</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(new Date().toLocaleString('vi-VN'))}</Data></Cell>
   </Row>
   <Row ss:Height="25">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">Tổng Số Bản Ghi</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(data.length)}</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell></Cell><Cell></Cell></Row>
   <Row ss:Height="20">
    <Cell ss:MergeAcross="1" ss:StyleID="sBold"><Data ss:Type="String">BỘ LỌC ĐÃ ÁP DỤNG</Data></Cell>
   </Row>
`;

  Object.entries(filters).forEach(([k, v]) => {
    let cleanVal = String(v);
    if (k === 'id_don_vi' || k === 'id_showroom') cleanVal = donViMap[String(v)] || String(v);
    const filterField = template.filters.find(f => f.key === k);
    const label = filterField ? filterField.label : k;

    xmlContent += `   <Row ss:Height="22">
    <Cell ss:StyleID="sMetaLabel"><Data ss:Type="String">${escapeXML(label)}</Data></Cell>
    <Cell ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(cleanVal || 'Tất cả')}</Data></Cell>
   </Row>\n`;
  });

  xmlContent += `  </Table>\n </Worksheet>\n</Workbook>`;

  const blob = new Blob(['\uFEFF' + xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);

  const subReportSuffix = filters.sub_report_type ? `_${filters.sub_report_type.replace(/\s+/g, '_')}` : '';
  const cleanTitle = template.title.replace(/\s+/g, '_');
  link.setAttribute("download", `BaoCao_${cleanTitle}${subReportSuffix}_${Date.now()}.xls`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
