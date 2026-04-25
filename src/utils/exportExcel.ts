// src/utils/exportExcel.ts

// 1. Helper dùng chung
const escapeXML = (str: any) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const getSanitizeSheetName = () => {
  const usedNames = new Set();
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

// 🟢 ĐÃ FIX LỖI: Chỉ kẻ viền (Borders) cho sHeader, sBold và sData. Bỏ viền của Default.
const XML_STYLES = `
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="11"/>
  </Style>
  <Style ss:ID="sHeader">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="12" ss:Bold="1"/>
   <Interior ss:Color="#D9D9D9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="sData">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="sBold">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>
`;

// ============================================================================
// 🟢 MODULE 1: XUẤT BÁO CÁO KHẢO SÁT AN NINH BẢO VỆ
// ============================================================================
export const exportSecurityReport = (
  selectedUnit: any,
  unitsToExport: any[],
  anNinhData: any[],
  isParentUnit: boolean,
  getUnitIdSafe: (item: any) => string
) => {
  if (!selectedUnit || unitsToExport.length === 0) return;

  const sanitizeSheetName = getSanitizeSheetName();

  let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${XML_STYLES}`;

  unitsToExport.forEach((unit) => {
    const sec = anNinhData.find((a: any) => getUnitIdSafe(a) === unit.id) || {};
    const sName = escapeXML(sanitizeSheetName(unit.ten_don_vi));

    // Thêm ss:StyleID="sData" vào tất cả các ô để nó chỉ kẻ viền khu vực này
    xmlContent += `
 <Worksheet ss:Name="${sName}">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60">
   <Column ss:Width="200"/>
   <Column ss:Width="400"/>
   <Column ss:Width="150"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nội dung</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Thông tin chi tiết</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Ghi chú</Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Tên Showroom/Kho xe/Điểm xưởng</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(unit.ten_don_vi)}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Địa chỉ</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(unit.dia_chi)}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Vị trí (tiếp giáp đường, khu dân cư, đồng trống,…)</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• Phía trước tiếp giáp: ${escapeXML(sec.tiep_giap_truoc)}&#10;• Bên phải tiếp giáp: ${escapeXML(sec.tiep_giap_phai)}&#10;• Phía sau tiếp giáp: ${escapeXML(sec.tiep_giap_sau)}&#10;• Bên trái tiếp giáp: ${escapeXML(sec.tiep_giap_trai)}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">File layout đính kèm</Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Quy mô (số tầng, hầm,…)</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• ${unit.so_tang || 0} tầng, ${unit.so_ham || 0} hầm</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Diện tích</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• Tổng diện tích: ${unit.dien_tich || 0} m2</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Số cổng hoạt động/tổng số cổng</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• ${unit.so_cong || 0}/${unit.so_cong || 0} cổng</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Mô tả cơ sở vật chất liên quan công tác AN-BV</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• Mặt tiền: ${escapeXML(sec.hang_rao_truoc)}&#10;• Bên phải: ${escapeXML(sec.hang_rao_phai)}&#10;• Bên trái: ${escapeXML(sec.hang_rao_trai)}&#10;• Phía sau: ${escapeXML(sec.hang_rao_sau)}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Tổng số CB-NV</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${unit.tong_nhan_su || 0} người</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Số lượt khách bình quân/ngày</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${unit.luot_khach_bq || 0} khách/ngày</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Hệ thống camera</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• Số lượng camera: ${sec.sl_camera || 0}&#10;• Vị trí đặt hệ thống: ${escapeXML(sec.vi_tri_he_thong_camera)}&#10;• Vị trí màn hình quan sát: ${escapeXML(sec.vi_tri_gs_camera)}&#10;• Lưu trữ: ${sec.thoi_gian_luu || 0} ngày</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Hệ thống PCCC</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">• Có hệ thống báo cháy tự động&#10;• Tủ báo cháy đặt tại: ....&#10;• Có máy bơm,...</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sBold"><Data ss:Type="String">Tình hình an ninh trật tự</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(sec.tinh_hinh_khu_vuc)}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;
  });

  xmlContent += `</Workbook>`;

  const blob = new Blob(['\uFEFF' + xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  
  const fileName = isParentUnit ? `BaoCao_HeThong_${selectedUnit.id}` : `BaoCao_${selectedUnit.id}`;
  link.setAttribute("download", `${fileName}_${new Date().toISOString().slice(0, 10)}.xls`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ============================================================================
// 🟢 MODULE 2: (CHUẨN BỊ CHO TƯƠNG LAI) XUẤT BÁO CÁO PCCC
// ============================================================================
// export const exportPcccReport = (...) => { ... }