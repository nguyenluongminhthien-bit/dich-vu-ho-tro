
// ==========================================
// GOOGLE APPS SCRIPT - VERSION 5.1 (UPDATED MAPPING)
// ==========================================

const CONFIG = {
  sheets: {
    DonVi: ['DonVi'],
    NhanSu: ['DsNhanSu'],
    Xe: ['DSXe'],
    VanBan: ['ThongBao'],
    QDQT: ['QDQT'],
    Users: ['Users'],
    Logs: ['Logs']
  },
  // MAPPING: Key = Tên cột trong Sheet sau khi cleanHeader(), Value = Tên biến trong Frontend (types.ts)
  mappings: {
    DonVi: {
      'idcty': 'id',
      'mien': 'mien',
      'tendonvi': 'tenDonVi',
      'madonvi': 'maDonVi',
      'macaptren': 'maCapTren',
      'diachi': 'diaChi',
      'loaihinh': 'loaiHinh',
      'socong': 'soCong',
      'dientich': 'dienTich',
      'ham': 'ham',
      'tang': 'tang',
      'phongcho': 'phongCho',
      'luotkhachtb': 'luotKhachTB',
      'lddonvi': 'ldDonVi',
      'hotenld': 'hoTenLD',
      'sdtld': 'sdtLD',
      'mailld': 'mailLD',
      'dvhtkd1': 'dvhtKd1',
      'hotendvht1': 'hoTenDvht1',
      'sdtdvht1': 'sdtDvht1',
      'maildvht1': 'mailDvht1',
      'dvhtkd2': 'dvhtKd2',
      'hotendvht2': 'hoTenDvht2',
      'sdtdvht2': 'sdtDvht2',
      'maildvht2': 'mailDvht2',
      'tongnsanbv': 'tongNsAnBv',
      'tongnspvhc': 'tongNsPvhc',
      'slanbvnoibo': 'slAnBvNoiBo',
      'slanbvdichvu': 'slAnBvDichVu',
      'slpvhckhach': 'slPvhcKhach',
      'slpvhcvs': 'slPvhcVs',
      'socbnv': 'soCbNv',
      'trangthai': 'trangThai',
      'phuonganpctt': 'phuonganpctt',
      'phuonganpccn': 'phuonganpccn',
      'phuongananbv': 'phuongAnAnBv',
      'thuctranganbv': 'thuctrangANBV',
      'phiatruoc': 'phiaTruoc',
      'benphai': 'benPhai',
      'bentrai': 'benTrai',
      'phiasau': 'phiaSau',
      'dinhbienan': 'dinhBienAN',
      'ngaycodinh': 'anbvNgayCoDinh',
      'ngaytuantra': 'anbvNgayTuanTra',
      'demcodinh': 'anbvDemCoDinh',
      'demtuantra': 'anbvDemTuanTra',
      'vitribhvdv': 'viTriBvDv',
      'chiphibvdv': 'chiPhiBvDv',
      'dinhbienpvhc': 'dinhBienPVHC',
      'pvhcdv': 'pvhcdv', // Đồng bộ mapping cho cột pvhcdv
      'chiphipvhcdv': 'chiPhiPvhcDv',
      // Mới thêm cho Hệ thống An ninh & PCCC
      'slcamera': 'slCamera',
      'thoigianluuhinh': 'thoiGianLuuHinh',
      'htbaochaytudong': 'htBaoChayTuDong',
      'vitritubaochay': 'viTriTuBaoChay',
      'hethongbompccc': 'heThongBomPccc',
      // Mới thêm cho Phòng họp
      'phop1': 'phop1',
      'vitriphop1': 'vitriPhop1',
      'scphop1': 'scPhop1',
      'manphop1': 'manPhop1',
      'onlinephop1': 'onlinePhop1',
      'layout1': 'layout1',
      'phop2': 'phop2',
      'vitriphop2': 'vitriPhop2',
      'scphop2': 'scPhop2',
      'manphop2': 'manPhop2',
      'onlinephop2': 'onlinePhop2',
      'layout2': 'layout2',
      'phop3': 'phop3',
      'vitriphop3': 'vitriPhop3',
      'scphop3': 'scPhop3',
      'manphop3': 'manPhop3',
      'onlinephop3': 'onlinePhop3',
      'layout3': 'layout3',
      'phop4': 'phop4',
      'vitriphop4': 'vitriPhop4',
      'scphop4': 'scPhop4',
      'manphop4': 'manPhop4',
      'onlinephop4': 'onlinePhop4',
      'layout4': 'layout4',
      'phop5': 'phop5',
      'vitriphop5': 'vitriPhop5',
      'scphop5': 'scPhop5',
      'manphop5': 'manPhop5',
      'onlinephop5': 'onlinePhop5',
      'layout5': 'layout5'
    },
    NhanSu: {
      'idns': 'id',
      'msnv': 'msnv',
      'hovaten': 'hoTen',
      'sdt': 'sdt',
      'email': 'email',
      'gioitinh': 'gioiTinh',
      'ngaysinh': 'ngaySinh',
      'tuoi': 'tuoi',
      'madonvi': 'maDonVi',
      'macaptren': 'maCapTren',
      'vitri': 'viTri',
      'ngayvaolam': 'ngayVaoLam',
      'trinhdo': 'trinhDo',
      'thamnienbvnam': 'thamNienBV',
      'kinhnghiem': 'kinhNghiem',
      'motangoaihinh': 'moTaNgoaiHinh',
      'atvsld': 'atvsld',
      'anbv': 'anbv',
      'pccc': 'pccc',
      'chcn': 'chcn',
      'socapcuu': 'soCapCuu',
      'cpr': 'cpr',
      'vothuat': 'voThuat',
      'gplx': 'gplx',
      'attp': 'attp',
      'phache': 'phaChe',
      'ngoaingu': 'ngoaingu',
      'tinhoc': 'tinhoc',
      'ghichu': 'ghiChu',
      'luong': 'thuNhap'
    },
    Xe: {
      'idxe': 'id',
      'madonvi': 'maDonVi',
      'macaptren': 'maCapTren',
      'mucdichsudung': 'mucDichSuDung',
      'mataisan': 'maTaiSan',
      'hinhthucsohuu': 'hinhThucSoHuu',
      'donvichusohuu': 'donViChuSoHuu',
      'nguyengia': 'nguyenGia',
      'chiphithuekhaohao': 'chiPhiThueKhauHao',
      'phannhanchiuchiphi': 'phanNhanChiuChiPhi',
      'loaiphuongtien': 'loaiPhuongTien',
      'hieuxe': 'hieuXe',
      'loaixe': 'loaiXe',
      'bienso': 'bienSo',
      'phienban': 'phienBan',
      'namsx': 'namSX',
      'namdk': 'namDK',
      'socho': 'soCho',
      'loainhienlieu': 'loaiNhienLieu',
      'dungtich': 'dungTich',
      'congthucbanh': 'congThucBanh',
      'mauxe': 'mauXe',
      'sokhung': 'soKhung',
      'somay': 'soMay',
      'kmhientai': 'kmHienTai',
      'tansuat': 'tanSuat',
      'nguyenlieusudungtrongthang': 'nlSuDungTrongThang',
      'chipinguyenlieu': 'chiPhiNguyenLieu',
      'gps': 'gps',
      'hientrang': 'hienTrang',
      'ghichu': 'ghiChu'
    },
    VanBan: {
      'idtb': 'id',
      'loaivanban': 'loaiVanBan',
      'sohieu': 'soHieu',
      'ngaybanhanh': 'ngayBanHanh',
      'noidung': 'noiDungTen',
      'nguoiky': 'nguoiKy',
      'chucvu': 'chucVu',
      'donvitrinh': 'donViTrinh',
      'nguoilayso': 'nguoiLaySo',
      'phamvi': 'phamVi',
      'hieuluc': 'hieuLuc',
      'linkfile': 'linkFile',
      'bophan': 'boPhan'
    },
    QDQT: {
      'idqd': 'id',
      'dmquytrinh': 'dmQuyTrinh',
      'sohieu': 'soHieu',
      'ngaybanhanh': 'ngayBanHanh',
      'tenvb': 'noiDungTen',
      'linkfile': 'linkFile'
    },
    Users: {
      'id': 'id',       
      'email': 'email',
      'hoten': 'hoTen',
      'vaitro': 'vaiTro',
      'madonvi': 'maDonVi',
      'phanquyen': 'phanQuyen',
      'password': 'password' 
    },
  }
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) return createJSON({ success: false, message: "System busy" });

    const params = e.parameter || {};
    let body = {};
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (ex) {}
    }

    const action = (params.action || body.action || "").toLowerCase();
    const type = (body.type || params.type || "");
    const doc = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'readall') {
      return createJSON({
        success: true,
        units: getSheetData(doc, 'DonVi'),
        personnel: getSheetData(doc, 'NhanSu'),
        vehicles: getSheetData(doc, 'Xe'),
        documents: [
          ...getSheetData(doc, 'VanBan').map(i => ({ ...i, loai: 'ThongBao' })),
          ...getSheetData(doc, 'QDQT').map(i => ({ ...i, loai: 'QuyDinh' }))
        ],
        users: getSheetData(doc, 'Users'),
        logs: getSheetData(doc, 'Logs')
      });
    }

    if (action === 'read') {
      return createJSON({ success: true, data: getSheetData(doc, type) });
    }

    const sheet = findSheet(doc, CONFIG.sheets[type] || [type]);
    if (!sheet) return createJSON({ success: false, message: "Sheet not found: " + type });

    if (action === 'create') return createJSON(addRow(sheet, type, body.data || body));
    if (action === 'update') return createJSON(updateRow(sheet, type, body.data || body));
    if (action === 'delete') return createJSON(deleteRow(sheet, type, body.id || params.id));

    return createJSON({ success: false, message: "Invalid action: " + action });

  } catch (err) {
    return createJSON({ success: false, message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function cleanHeader(header) {
  return String(header).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, ""); 
}

function getSheetData(doc, typeKey) {
  const sheet = findSheet(doc, CONFIG.sheets[typeKey] || [typeKey]);
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  // Lấy toàn bộ dữ liệu trong 1 lần gọi duy nhất để tối ưu tốc độ
  const allValues = sheet.getDataRange().getValues();
  const rawHeaders = allValues[0];
  const dataRows = allValues.slice(1);
  
  const mapping = CONFIG.mappings[typeKey] || {};
  const headerMap = {};
  
  rawHeaders.forEach((h, i) => {
    const clean = cleanHeader(h);
    if (mapping[clean]) {
      headerMap[i] = mapping[clean];
    }
  });

  return dataRows.filter(row => row[0] !== '').map((row) => { 
    const obj = {};
    Object.keys(headerMap).forEach(idx => {
      const key = headerMap[idx];
      let val = row[idx];
      
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "dd/MM/yyyy");
      }
      
      if (typeof val === 'string') {
        const lowerVal = val.toLowerCase().trim();
        if (lowerVal === 'true') val = true;
        else if (lowerVal === 'false') val = false;
      }
      
      obj[key] = val;
    });
    obj.id = String(row[0]); 
    return obj;
  });
}

function addRow(sheet, type, data) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapping = CONFIG.mappings[type] || {};
  
  const newRow = headers.map((h, i) => {
    const clean = cleanHeader(h);
    const frontendKey = mapping[clean];
    
    if (i === 0 && !data.id) {
       return (type + "_" + Date.now()).toString();
    }
    
    if (frontendKey && data[frontendKey] !== undefined) {
      let val = data[frontendKey];
      if (typeof val === 'boolean') return val ? "TRUE" : "FALSE";
      return val;
    }
    return "";
  });
  
  sheet.appendRow(newRow);
  // Loại bỏ flush() để tăng tốc độ ghi
  return { success: true };
}

function updateRow(sheet, type, data) {
  const id = String(data.id).trim();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, message: "Sheet empty" };
  
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let rowIndex = -1;
  
  for(let i = 0; i < ids.length; i++) {
    if(String(ids[i][0]).trim() === id) {
      rowIndex = i + 2;
      break;
    }
  }

  if (rowIndex === -1) return { success: false, message: "Không tìm thấy ID: " + id };
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const mapping = CONFIG.mappings[type] || {};
  const currentValues = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn()).getValues()[0];

  const updatedValues = headers.map((h, i) => {
    const clean = cleanHeader(h);
    const frontendKey = mapping[clean];

    if (frontendKey && data[frontendKey] !== undefined) {
      let val = data[frontendKey];
      if (typeof val === 'boolean') return val ? "TRUE" : "FALSE";
      return val;
    }
    return currentValues[i];
  });

  sheet.getRange(rowIndex, 1, 1, updatedValues.length).setValues([updatedValues]);
  // Loại bỏ flush() để tăng tốc độ ghi
  return { success: true };
}

function deleteRow(sheet, type, id) {
  if (!id) return { success: false, message: "ID is missing" };
  const idStr = String(id).trim();

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { success: false, message: "Sheet empty" };

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]).trim() === idStr) {
       sheet.deleteRow(i + 2); 
       // Loại bỏ flush() để tăng tốc độ ghi
       return { success: true };
    }
  }
  
  return { success: false, message: "Không tìm thấy dòng chứa ID: " + idStr };
}

function findSheet(doc, names) {
  for (let n of names) {
    let s = doc.getSheetByName(n);
    if (s) return s;
  }
  return null;
}

function createJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
