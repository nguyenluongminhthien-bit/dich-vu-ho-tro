// geocode_don_vi.js
// Script chỉ đọc (read-only) lấy tọa độ đề xuất từ Nominatim API cho các đơn vị thiếu tọa độ.
// Không thực hiện ghi/UPDATE bất kỳ thông tin nào lên Supabase.

import fs from 'fs';
import path from 'path';

// Trích xuất SUPABASE_URL và SUPABASE_ANON_KEY từ client.ts để tránh hardcode lỗi thời
const CLIENT_TS_PATH = path.resolve('src/services/api/client.ts');
let supabaseUrl = 'https://eizpyrhqshkhcghkupjy.supabase.co';
let supabaseAnonKey = '';

try {
  const clientTsContent = fs.readFileSync(CLIENT_TS_PATH, 'utf-8');
  const urlMatch = clientTsContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
  const keyMatch = clientTsContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
  if (urlMatch) supabaseUrl = urlMatch[1];
  if (keyMatch) supabaseAnonKey = keyMatch[1];
} catch (error) {
  console.warn('Không thể đọc cấu hình trực tiếp từ client.ts, sử dụng cấu hình mặc định.', error.message);
}

if (!supabaseAnonKey) {
  console.error('Không tìm thấy SUPABASE_ANON_KEY. Vui lòng kiểm tra lại src/services/api/client.ts');
  process.exit(1);
}

// Hàm trì hoãn (sleep)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAllDonVi() {
  let allUnits = [];
  let start = 0;
  const limit = 1000;
  let hasMore = true;

  console.log(`Đang tải dữ liệu từ Supabase (${supabaseUrl})...`);

  while (hasMore) {
    const end = start + limit - 1;
    const response = await fetch(`${supabaseUrl}/rest/v1/dm_don_vi?select=id,ten_don_vi,dia_chi,vi_do,kinh_do`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Range-Unit': 'items',
        'Range': `${start}-${end}`
      }
    });

    if (!response.ok) {
      throw new Error(`Lỗi tải dữ liệu dm_don_vi: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    allUnits = allUnits.concat(data);

    if (data.length < limit) {
      hasMore = false;
    } else {
      start += limit;
    }
  }

  return allUnits;
}

async function geocodeAddress(address) {
  if (!address || address.trim() === '') {
    return { success: false, note: 'ĐỊA CHỈ TRỐNG' };
  }

  const cleanAddress = address.replace(/[\r\n\t]/g, ' ').trim();
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanAddress)}&format=json&countrycodes=vn&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'QTVP-ASDS-App'
      }
    });

    if (response.status === 403) {
      return { success: false, note: 'BỊ CHẶN IP (403)' };
    }

    if (!response.ok) {
      return { success: false, note: `HTTP ERROR ${response.status}` };
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        success: true,
        vi_do: parseFloat(data[0].lat),
        kinh_do: parseFloat(data[0].lon),
        note: 'TÌM THẤY'
      };
    } else {
      return { success: false, note: 'KHÔNG TÌM THẤY' };
    }
  } catch (error) {
    return { success: false, note: `LỖI KẾT NỐI: ${error.message}` };
  }
}

async function run() {
  try {
    const donViList = await fetchAllDonVi();
    console.log(`Đã tải xong ${donViList.length} đơn vị từ Supabase.`);

    // Lọc các đơn vị thiếu vĩ độ hoặc kinh độ hoặc tọa độ bằng 0
    const pendingUnits = donViList.filter(u => {
      const lat = parseFloat(u.vi_do);
      const lng = parseFloat(u.kinh_do);
      return isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0;
    });

    console.log(`Phát hiện ${pendingUnits.length} đơn vị chưa có tọa độ (hoặc tọa độ không hợp lệ). Bắt đầu geocode đề xuất...`);
    console.log('---------------------------------------------------------------------------------------------------------------------');
    console.log(`| ${'Tên đơn vị'.padEnd(35)} | ${'Địa chỉ'.padEnd(50)} | ${'Tọa độ đề xuất'.padEnd(25)} | ${'Ghi chú'.padEnd(15)} |`);
    console.log('---------------------------------------------------------------------------------------------------------------------');

    for (let i = 0; i < pendingUnits.length; i++) {
      const u = pendingUnits[i];
      
      // Chờ tối thiểu 1.2s để tránh bị block IP theo rule của Nominatim API
      await sleep(1200);

      const result = await geocodeAddress(u.dia_chi);
      let coordStr = 'N/A';
      if (result.success) {
        coordStr = `${result.vi_do.toFixed(6)}, ${result.kinh_do.toFixed(6)}`;
      }

      const tenShort = u.ten_don_vi.substring(0, 35);
      const diaChiShort = (u.dia_chi || '').substring(0, 50);

      console.log(`| ${tenShort.padEnd(35)} | ${diaChiShort.padEnd(50)} | ${coordStr.padEnd(25)} | ${result.note.padEnd(15)} |`);
    }
    console.log('---------------------------------------------------------------------------------------------------------------------');
    console.log('Hoàn tất quá trình quét geocode đề xuất. Không có dữ liệu nào bị sửa đổi trên database.');
  } catch (err) {
    console.error('Lỗi thực thi:', err.message);
  }
}

run();
