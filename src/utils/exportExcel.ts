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
  <Style ss:ID="sTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="16" ss:Bold="1" ss:Color="#05469B"/>
  </Style>
  <Style ss:ID="sSubtitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Size="11" ss:Italic="1"/>
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
  <Style ss:ID="sDataCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="sDataRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Top" ss:WrapText="1"/>
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
  <Style ss:ID="sBoldNoBorder">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman" ss:Bold="1"/>
  </Style>
  <Style ss:ID="sMetaValue">
   <Alignment ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:FontName="Times New Roman" x:CharSet="163" x:Family="Roman"/>
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

// ============================================================================
// 🟢 MODULE 3: XUẤT NHẬT KÝ SỬ DỤNG XE
// ============================================================================
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export const exportVehicleSchedule = (
  nhatKyList: any[],
  xeData: any[],
  dateStart: string,
  dateEnd: string,
  platesToExport: string[]
) => {
  const sanitizeSheetName = getSanitizeSheetName();

  let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
${XML_STYLES}`;

  const groups: Record<string, any[]> = {};
  
  const targetPlates = platesToExport && platesToExport.length > 0
    ? platesToExport
    : [...new Set(nhatKyList.map(item => item.bien_so).filter(Boolean))];

  targetPlates.forEach(plate => {
    const logs = nhatKyList.filter(item => item.bien_so === plate);
    groups[plate] = logs;
  });

  const plates = Object.keys(groups);

  if (plates.length === 0) {
    const sName = escapeXML(sanitizeSheetName("Nhat ky"));
    xmlContent += `
 <Worksheet ss:Name="${sName}">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60">
   <Column ss:Width="250"/>
   <Row ss:Height="30">
    <Cell ss:MergeAcross="8" ss:StyleID="sTitle"><Data ss:Type="String">NHẬT KÝ SỬ DỤNG XE</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="8" ss:StyleID="sSubtitle"><Data ss:Type="String">Không có dữ liệu trong khoảng thời gian được chọn</Data></Cell>
   </Row>
  </Table>
 </Worksheet>`;
  } else {
    plates.forEach(plate => {
      const logs = groups[plate].sort((a, b) => {
        const dateA = a.created_at || a.id || '';
        const dateB = b.created_at || b.id || '';
        return dateA.localeCompare(dateB);
      });

      const sName = escapeXML(sanitizeSheetName(plate));
      const xe = xeData.find(x => x.bien_so === plate) || {};
      const loaiXeText = xe.hieu_xe 
        ? `${xe.hieu_xe} - ${xe.loai_xe}${xe.phien_ban ? ` (${xe.phien_ban})` : ''}`
        : '---';

      const kmDau = logs.length > 0 && logs[0].so_km_di ? Number(logs[0].so_km_di) : 0;
      
      let kmCuoi = kmDau;
      if (logs.length > 0) {
        const lastLog = logs[logs.length - 1];
        kmCuoi = lastLog.so_km_ve ? Number(lastLog.so_km_ve) : (lastLog.so_km_di ? Number(lastLog.so_km_di) : kmDau);
      }
      
      const tongKmMonth = kmCuoi >= kmDau ? kmCuoi - kmDau : 0;

      xmlContent += `
 <Worksheet ss:Name="${sName}">
  <Table x:FullColumns="1" x:FullRows="1" ss:DefaultColumnWidth="60">
   <Column ss:Width="40"/>
   <Column ss:Width="160"/>
   <Column ss:Width="100"/>
   <Column ss:Width="130"/>
   <Column ss:Width="180"/>
   <Column ss:Width="180"/>
   <Column ss:Width="80"/>
   <Column ss:Width="80"/>
   <Column ss:Width="100"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="8" ss:StyleID="sTitle"><Data ss:Type="String">NHẬT KÝ SỬ DỤNG XE</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="sSubtitle"><Data ss:Type="String">Từ ngày ${dateStart ? formatDate(dateStart) : '...'} đến ngày ${dateEnd ? formatDate(dateEnd) : '...'}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="sBoldNoBorder"><Data ss:Type="String">Loại xe:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(loaiXeText)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="sBoldNoBorder"><Data ss:Type="String">Biển kiểm soát:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="sMetaValue"><Data ss:Type="String">${escapeXML(plate)}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="sBoldNoBorder"><Data ss:Type="String">Số Km đầu khoảng:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="sMetaValue"><Data ss:Type="Number">${kmDau}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="sBoldNoBorder"><Data ss:Type="String">Số Km cuối khoảng:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="sMetaValue"><Data ss:Type="Number">${kmCuoi}</Data></Cell>
   </Row>
   <Row ss:Height="18">
    <Cell ss:MergeAcross="2" ss:StyleID="sBoldNoBorder"><Data ss:Type="String">Tổng số km đi trong khoảng:</Data></Cell>
    <Cell ss:MergeAcross="5" ss:StyleID="sMetaValue"><Data ss:Type="Number">${tongKmMonth}</Data></Cell>
   </Row>
   <Row ss:Height="15"/>

   <Row ss:Height="25">
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Stt</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Giờ, Ngày/tháng/năm</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Biển kiểm soát xe</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Mục đích sử dụng</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nơi đi</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Nơi đến</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Km lúc đi</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Km lúc về</Data></Cell>
    <Cell ss:StyleID="sHeader"><Data ss:Type="String">Tổng số Km hành trình</Data></Cell>
   </Row>`;

      logs.forEach((log, index) => {
        const rowKmDi = log.so_km_di ? Number(log.so_km_di) : '';
        const rowKmVe = log.so_km_ve ? Number(log.so_km_ve) : '';
        const rowTongKm = log.tong_km ? Number(log.tong_km) : '';

        xmlContent += `
   <Row ss:AutoFitHeight="1">
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="Number">${index + 1}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(log.thoi_gian_su_dung || '')}</Data></Cell>
    <Cell ss:StyleID="sDataCenter"><Data ss:Type="String">${escapeXML(log.bien_so || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(log.muc_dich_su_dung || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(log.noi_di || '')}</Data></Cell>
    <Cell ss:StyleID="sData"><Data ss:Type="String">${escapeXML(log.noi_den || '')}</Data></Cell>
    <Cell ss:StyleID="sDataRight">${rowKmDi !== '' ? `<Data ss:Type="Number">${rowKmDi}</Data>` : '<Data ss:Type="String"></Data>'}</Cell>
    <Cell ss:StyleID="sDataRight">${rowKmVe !== '' ? `<Data ss:Type="Number">${rowKmVe}</Data>` : '<Data ss:Type="String"></Data>'}</Cell>
    <Cell ss:StyleID="sDataRight">${rowTongKm !== '' ? `<Data ss:Type="Number">${rowTongKm}</Data>` : '<Data ss:Type="String"></Data>'}</Cell>
   </Row>`;
      });

      xmlContent += `
  </Table>
 </Worksheet>`;
    });
  }

  xmlContent += `</Workbook>`;

  const blob = new Blob(['\uFEFF' + xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  
  const dateSuffix = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `NhatKy_SuDungXe_${dateSuffix}.xls`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};