
export enum Role {
  ADMIN = 'Admin',
  CTY = 'Cty',
  SR = 'SR'
}

export interface User {
  id?: string;
  email: string;
  hoTen: string;
  vaiTro: Role;
  maDonVi: string;
  phanQuyen: string;
  password?: string;
}

export interface DonVi {
  id: string;
  mien: string;
  tenDonVi: string;
  maDonVi: string;
  maCapTren: string;
  diaChi: string;
  loaiHinh: string;
  soCong: number;
  dienTich: number;
  ham: number;
  tang: number;
  phongCho: number;
  luotKhachTB: number;
  ldDonVi: string;
  hoTenLD: string;
  sdtLD: string;
  mailLD: string;
  
  // Kinh doanh xe
  cdLanhDaoKdx?: string;
  hoTenLdKdx?: string;
  sdtLdKdx?: string;
  mailLdKdx?: string;
  
  // Kinh doanh DVPT
  cdLanhDaoDvpt?: string;
  hoTenLdDvpt?: string;
  sdtLdDvpt?: string;
  mailLdDvpt?: string;

  sdtDvht1: string;
  mailDvht1: string;
  dvhtKd2?: string;
  hoTenDvht2?: string;
  sdtDvht2?: string;
  mailDvht2?: string;
  
  // Tổng hợp (Tính toán)
  tongNsAnBv: number;
  tongNsPvhc: number;
  
  // Số lượng chi tiết
  slAnBvNoiBo: number;
  slAnBvDichVu: number;
  slPvhcKhach: number;
  slPvhcVs: number;
  
  soCbNv: number;
  trangThai: string;
  
  // Link hồ sơ
  phuonganpctt?: string;
  phuonganpccn?: string;
  phuongAnAnBv?: string;
  thuctrangANBV: string;
  
  // Tiếp giáp địa lý
  phiaTruoc?: string; 
  benPhai?: string; 
  benTrai?: string; 
  phiaSau?: string; 
  
  // Chi tiết ANBV
  dinhBienAN?: number; 
  anbvNgayCoDinh?: number; 
  anbvNgayTuanTra?: number; 
  anbvDemCoDinh?: number; 
  anbvDemTuanTra?: number; 
  
  viTriBvDv?: string; // Vị trí Bảo vệ DV
  chiPhiBvDv?: number; // Chi phí Bảo vệ DV
  
  // Chi tiết PVHC
  dinhBienPVHC?: number; 
  chiPhiPvhcDv?: number; // Chi phí PVHC Dịch vụ (Kiểu số)
  pvhcdv?: string; // Vị trí PVHC Dịch vụ (Kiểu chuỗi để mô tả vị trí)
  
  // Hệ thống An ninh & PCCC (Mới)
  slCamera?: number;
  thoiGianLuuHinh?: number;
  htBaoChayTuDong?: boolean;
  viTriTuBaoChay?: string;
  heThongBomPccc?: boolean;

  // Phòng họp 1
  phop1?: boolean;
  vitriPhop1?: string;
  scPhop1?: number;
  manPhop1?: string;
  onlinePhop1?: boolean;
  layout1?: string;

  // Phòng họp 2
  phop2?: boolean;
  vitriPhop2?: string;
  scPhop2?: number;
  manPhop2?: string;
  onlinePhop2?: boolean;
  layout2?: string;

  // Phòng họp 3
  phop3?: boolean;
  vitriPhop3?: string;
  scPhop3?: number;
  manPhop3?: string;
  onlinePhop3?: boolean;
  layout3?: string;

  // Phòng họp 4
  phop4?: boolean;
  vitriPhop4?: string;
  scPhop4?: number;
  manPhop4?: string;
  onlinePhop4?: boolean;
  layout4?: string;

  // Phòng họp 5
  phop5?: boolean;
  vitriPhop5?: string;
  scPhop5?: number;
  manPhop5?: string;
  onlinePhop5?: boolean;
  layout5?: string;
}

export interface NhanSu {
  id: string;
  msnv: string;
  hoTen: string;
  gioiTinh: string;
  ngaySinh: string;
  tuoi?: number;
  sdt?: string; // New field
  email?: string; // New field
  maDonVi: string;
  maCapTren?: string;
  viTri?: string;
  ngayVaoLam?: string;
  trinhDo?: string;
  thamNienBV?: number;
  kinhNghiem?: string;
  moTaNgoaiHinh?: string;
  atvsld?: boolean;
  anbv?: boolean;
  pccc?: boolean;
  chcn?: boolean;
  soCapCuu?: boolean;
  cpr?: boolean;
  voThuat?: boolean;
  attp?: boolean;
  phaChe?: boolean;
  ngoaingu?: boolean;
  tinhoc?: boolean;
  gplx?: string;
  thuNhap?: number;
  ghiChu?: string;
  createdBy?: string;
}

export interface Xe {
  id: string;
  maDonVi: string;
  maCapTren?: string;
  mucDichSuDung?: string;
  maTaiSan?: string;
  hinhThucSoHuu?: string;
  donViChuSoHuu?: string;
  nguyenGia?: number;
  chiPhiThueKhauHao?: number;
  phanNhanChiuChiPhi?: string;
  loaiPhuongTien: string;
  hieuXe: string;
  loaiXe: string;
  bienSo: string;
  phienBan?: string;
  namSX?: number;
  namDK?: number;
  soCho?: number;
  loaiNhienLieu?: string;
  dungTich?: string;
  congThucBanh?: string;
  mauXe: string;
  soKhung?: string;
  soMay?: string;
  kmHienTai: number;
  tanSuat?: string;
  nlSuDungTrongThang?: number;
  chiPhiNguyenLieu: number;
  gps?: boolean;
  hienTrang: string;
  ghiChu?: string;
}

export interface VanBan {
  id: string;
  loai: 'ThongBao' | 'QuyDinh';
  loaiVanBan?: string;
  dmQuyTrinh?: string;
  soHieu: string;
  ngayBanHanh: string;
  noiDungTen: string;
  nguoiKy?: string;
  chucVu?: string;
  donViTrinh?: string;
  nguoiLaySo?: string;
  phamVi?: string;
  hieuLuc?: string;
  linkFile: string;
  boPhan?: string;
}

export interface Log {
  id: string;
  thoiGian: string;
  email: string;
  hanhDong: string;
  noiDung: string;
}
