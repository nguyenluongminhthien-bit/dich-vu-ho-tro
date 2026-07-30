const SUPABASE_URL = 'https://eizpyrhqshkhcghkupjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpenB5cmhxc2hraGNnaGt1cGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNzUyNTcsImV4cCI6MjA5MDk1MTI1N30.Whb7fJVbGMeCPN0M07BchRFvHtIiH5ZTSCeSu2l4RPc';
const HEADERS = {
  "apikey": SUPABASE_ANON_KEY,
  "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json"
};

// Hàm tải TOÀN BỘ dữ liệu 1 bảng, tự động phân trang Range 1000 dòng/request
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
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return allRows;
}

async function suggestKhoaHocDonVi() {
  try {
    console.log('Đang tải danh sách khóa học...');
    const khoaHocList = await fetchAllRows('hs_khoa_huan_luyen');
    console.log('Đang tải danh sách học viên...');
    const hocVienList = await fetchAllRows('hs_hoc_vien_khoa_huan_luyen');
    console.log('Đang tải danh sách đơn vị...');
    const donViList = await fetchAllRows('dm_don_vi');

    console.log(`\nĐã tải: ${khoaHocList.length} khóa học | ${hocVienList.length} học viên | ${donViList.length} đơn vị.`);

    // Map tên đơn vị để hiển thị
    const donViMap = {};
    donViList.forEach(d => { donViMap[d.id] = d.ten_don_vi; });

    // Lọc các khóa học chưa có id_don_vi
    const targetKhoaHocs = khoaHocList.filter(kh => !kh.id_don_vi);
    console.log(`Tìm thấy ${targetKhoaHocs.length} khóa học chưa gán đơn vị (id_don_vi trống).\n`);

    const proposals = [];

    targetKhoaHocs.forEach(kh => {
      // Lấy học viên thuộc khóa học này và có thông tin đơn vị
      const currentHvList = hocVienList.filter(hv => hv.id_khoa_hoc === kh.id && hv.id_don_vi);
      
      if (currentHvList.length === 0) {
        proposals.push({
          "ID Khóa": kh.id,
          "Tên khóa học": kh.ten_khoa_hoc,
          "Tổng học viên": 0,
          "Đơn vị chiếm đa số": "N/A",
          "Tỷ lệ % khớp": "0%",
          "Đề xuất hành động": "GIỮ TRỐNG - không có học viên"
        });
        return;
      }

      // Đếm tần suất xuất hiện của từng id_don_vi
      const counts = {};
      currentHvList.forEach(hv => {
        counts[hv.id_don_vi] = (counts[hv.id_don_vi] || 0) + 1;
      });

      // Tìm đơn vị có số lượng nhiều nhất
      let majorityUnitId = null;
      let maxCount = 0;
      Object.keys(counts).forEach(unitId => {
        if (counts[unitId] > maxCount) {
          maxCount = counts[unitId];
          majorityUnitId = unitId;
        }
      });

      const totalValid = currentHvList.length;
      const rate = Math.round((maxCount / totalValid) * 100);
      const majorityUnitName = donViMap[majorityUnitId] || 'Không xác định';

      let suggestion = "GIỮ TRỐNG - đa đơn vị";
      if (rate >= 90) {
        suggestion = `Gán: ${majorityUnitName} (${majorityUnitId})`;
      }

      proposals.push({
        "ID Khóa": kh.id,
        "Tên khóa học": kh.ten_khoa_hoc,
        "Tổng học viên": totalValid,
        "Đơn vị chiếm đa số": majorityUnitName,
        "Tỷ lệ % khớp": `${rate}%`,
        "Đề xuất hành động": suggestion
      });
    });

    console.log('================ DANH SÁCH KHÓA HỌC CHƯA GÁN ĐƠN VỊ & GỢI Ý ================');
    if (proposals.length === 0) {
      console.log('🎉 TẤT CẢ CÁC KHÓA HỌC ĐÃ ĐƯỢC GÁN ĐƠN VỊ ĐẦY ĐỦ.');
    } else {
      console.table(proposals);
    }
    console.log('============================================================================\n');

  } catch (err) {
    console.error('Đã xảy ra lỗi khi kiểm tra:', err.message);
  }
}

suggestKhoaHocDonVi();
