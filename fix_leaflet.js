// fix_leaflet.js
// Script download trực tiếp các file Leaflet 1.9.4 thực tế từ unpkg CDN
// và ghi đè vào node_modules/leaflet để sửa lỗi file 0-byte do đĩa ảo Google Drive bị nghẽn.

import fs from 'fs';
import path from 'path';

const LEAFLET_DIR = path.resolve('node_modules/leaflet');
const DIST_DIR = path.join(LEAFLET_DIR, 'dist');

const FILES_TO_DOWNLOAD = [
  {
    url: 'https://unpkg.com/leaflet@1.9.4/package.json',
    dest: path.join(LEAFLET_DIR, 'package.json')
  },
  {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    dest: path.join(DIST_DIR, 'leaflet.css')
  },
  {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    dest: path.join(DIST_DIR, 'leaflet.js')
  },
  {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.js',
    dest: path.join(DIST_DIR, 'leaflet-src.js')
  },
  {
    url: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js',
    dest: path.join(DIST_DIR, 'leaflet-src.esm.js')
  }
];

async function downloadFile(url, destPath) {
  console.log(`Đang tải: ${url} ...`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Lỗi tải file ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  
  // Đảm bảo thư mục cha tồn tại
  const parentDir = path.dirname(destPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  // Ghi tệp
  fs.writeFileSync(destPath, text, 'utf-8');
  console.log(`Đã ghi thành công vào: ${destPath} (Kích thước: ${text.length} ký tự)`);
}

async function run() {
  try {
    console.log('Bắt đầu đồng bộ Leaflet CDN...');
    for (const item of FILES_TO_DOWNLOAD) {
      await downloadFile(item.url, item.dest);
      // Chờ một chút để đĩa ảo xử lý ghi ổn định
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log('Hoàn thành việc khôi phục các tệp tin Leaflet!');
  } catch (err) {
    console.error('Lỗi khi tải hoặc ghi file Leaflet:', err.message);
  }
}

run();
