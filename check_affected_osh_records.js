const SUPABASE_URL = 'https://eizpyrhqshkhcghkupjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpenB5cmhxc2hraGNnaGt1cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzUyNTcsImV4cCI6MjA5MDk1MTI1N30.Whb7fJVbGMeCPN0M07BchRFvHtIiH5ZTSCeSu2l4RPc';
const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// Hàm tải TOÀN BỘ dữ liệu 1 bảng, tự động phân trang để tránh giới hạn 1000 dòng/request
async function fetchAllRows(tableName) {
  const PAGE_SIZE = 1000;
  let allRows = [];
  let from = 0;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: { ...HEADERS, "Range": `${from}-${from + PAGE_SIZE - 1}` }
    });
    if (!res.ok) throw new Error(`Lỗi tải ${tableName}: ${await res.text()}`);
    const rows = await res.json();
    allRows = allRows.concat(rows);
    if (rows.length < PAGE_SIZE) break; // Đã lấy hết
    from += PAGE_SIZE;
  }
  return allRows;
}

async function auditDatabase() {
  try {
    console.log('Đang tải danh sách học viên từ database (có phân trang)...');
    const hocVienList = await fetchAllRows('hs_hoc_vien_khoa_huan_luyen');
    console.log('Đang tải danh sách nhân sự từ database (có phân trang)...');
    const personnelList = await fetchAllRows('ns_dich_vu');
    console.log(`Đã tải ${hocVienList.length} học viên và ${personnelList.length} nhân sự.`);

    const failedStudents = hocVienList.filter(hv => {
      const kq = String(hv.ket_qua || '').trim().toLowerCase().normalize('NFC');
      return kq.includes('chưa đạt') || kq.includes('chua dat');
    });
    console.log(`Tìm thấy ${failedStudents.length} học viên có kết quả "Chưa đạt" trong CSDL.`);

    // SỬA LỖI: Gom nhóm theo MSNV thành MẢNG, vì 1 MSNV có thể ứng với nhiều hồ sơ 
    // (hồ sơ chính + hồ sơ Kiêm nhiệm dùng chung MSNV, xem handleDuplicate trong PersonnelPage.tsx)
    const personnelByMsnv = new Map();
    personnelList.forEach(p => {
      const key = p.ma_so_nhan_vien;
      if (!personnelByMsnv.has(key)) personnelByMsnv.set(key, []);
      personnelByMsnv.get(key).push(p);
    });

    const affectedRecords = [];
    failedStudents.forEach(hv => {
      const matchedPersons = personnelByMsnv.get(hv.msnv) || [];
      matchedPersons.forEach(person => {
        if (person.cc_atvsld === true) {
          affectedRecords.push({
            "ID Hồ sơ Nhân sự": person.id,
            "Mã nhân viên (MSNV)": hv.msnv,
            "Họ tên": hv.ho_ten,
            "Chức vụ (Nhân sự)": person.chuc_vu || '',
            "Đơn vị (Học viên)": hv.don_vi_text,
            "Kết quả thi": hv.ket_qua,
            "Trạng thái ATVSLĐ (Nhân sự)": 'Đã tick chọn (LỖI)',
            "Chứng chỉ hiện tại": person.chung_nhan || 'Không có',
            "Ngày hết hạn chứng chỉ": person.gia_tri_den || 'Không có'
          });
        }
      });
    });

    console.log('\n================ DANH SÁCH BẢN GHI NGHI VẤN BỊ ẢNH HƯỞNG ================');
    if (affectedRecords.length === 0) {
      console.log('✅ KHÔNG CÓ BẢN GHI NÀO BỊ LỖI.');
    } else {
      console.log(`⚠️ PHÁT HIỆN ${affectedRecords.length} BẢN GHI BỊ ẢNH HƯỞNG:`);
      console.table(affectedRecords);
      console.log('\nChi tiết dạng JSON:');
      console.log(JSON.stringify(affectedRecords, null, 2));
    }
    console.log('========================================================================\n');
  } catch (err) {
    console.error('Đã xảy ra lỗi khi kiểm tra:', err.message);
  }
}
auditDatabase();
