export interface User {
  username: string;
  role: 'ADMIN' | 'USER';
  idDonVi: string;
  hoTen: string;
}

// Cập nhật lại User cho khớp với Sheet Config_Users
export interface User {
  ID_User: string;
  Username: string;
  Password?: string;
  HoTen: string;
  ID_DonVi: string;
  NhomQuyen: string; 
}

// Thêm cấu trúc cho Nhật ký hệ thống
export interface SysLog {
  ID_Log: string;
  ThoiGian: string;
  ID_User: string;
  HanhDong: string;
  ChiTiet: string;
}

// ... Giữ nguyên các interface khác (DonVi, Personnel...) ở dưới

export interface DonVi {
  ID_DonVi: string;
  TenDonVi: string;
  CapQuanLy: string;
  DiaChi: string;
  DienTich: string | number;
  SoTang: string | number;
  SoHam: string | number;
  SoPhongCho: string | number;
  SoCong: string | number;
  LuotKhachBQ: string | number;
  TongNhanSu: string | number;
  loaiHinh: string;
  trangThai: string;
  Phia:string;
  ID_GiamDoc?: string;
  ID_PTKDXe?: string;
  ID_PTKDDVPT?: string;
  ID_DVHT1?: string;
  ID_DVHT2?: string;
  ID_HCNS?: string;
  [key: string]: any;
}

export interface Personnel {
  ID_NhanSu: string;
  MaNV: string;
  HoTen: string;
  ChucVu: string;
  SDT: string;
  Email: string;
  GioiTinh: string;
  NamSinh: string;
  NgayNhanViec: string;
  ID_DonVi: string;
  PhanLoai: string;
  TrinhDo: string;
  Tuoi?: string | number;       // Cột mới thêm
  ThamNien?: string;            // Cột mới thêm
  ThuNhap: string | number;
  MoTaNgoaiHinh: string;
  GhiChu: string;
  CC_ATVSLD: boolean;
  CC_ANBV: boolean;
  CC_PCCC: boolean;
  CC_CHCN: boolean;
  CC_SoCapCuu: boolean;
  CC_CPR: boolean;
  CC_VoThuat: boolean;
  CC_GPLX: boolean;
  CC_ATTP: boolean;
  CC_PhaChe: boolean;
  CC_NgoaiNgu: boolean;
  CC_TinHoc: boolean;
  [key: string]: any;
}

export interface AnNinh {
  ID_AnNinh: string;
  ID_DonVi: string;
  SoBaoVeNoiBo: string | number;
  SoBaoVeDichvu: string | number;
  VitrBVDV: string;
  NCC_DichVu: string;
  ChiPhiThue: string | number;
  TongANBV: string | number;
  DinhbienANBV: string | number;
  Ngaycd: string | number;
  Ngaytuantra: string | number;
  Demcd: string | number;
  Demtruantra: string | number;
  SLCAM: string | number;
  ThoiGianLuu: string;
  ViTriGiamSat: string;
  TinhHinhKhuVuc: string;
  TiepGiapTruoc: string;
  TiepGiapSau: string;
  TiepGiapTrai: string;
  TiepGiapPhai: string;
  Link_PhuongAnAN: string;
  [key: string]: any;
}

export interface TS_Xe {
  ID_Xe: string;
  ID_DonVi: string;
  Mucdichsudung: string;
  MaTaiSan: string;
  donvichusohuu: string;
  NguyenGia: string | number;
  Chiphithue_khaohao: string | number;
  BienSo: string;
  LoaiPhuongTien: string;
  HieuXe: string;
  LoaiXe: string;
  PhienBan: string;
  MauXe: string;
  NamSX: string | number;
  NamDK: string | number;
  SoKhung: string;
  SoMay: string;
  SoCho: string | number;
  LoaiNhienLieu: string;
  DungTich: string;
  CongThucBanh: string;
  HinhThucSoHuu: string;
  GPS: string;
  Hientrang: string;
  Ghichu: string;
  [key: string]: any;
}

// Tìm đến interface CP_HoatDongXe trong src/types/index.ts và thay thế:
export interface CP_HoatDongXe {
  ID_ChiPhiXe: string;
  ID_DonVi: string; // <-- THÊM DÒNG NÀY VÀO ĐÂY
  ThangNam: string; 
  ID_Xe: string;
  KmHienTai: string | number;
  SoLitNhienLieu: string | number;
  ChiPhiNhienLieu: string | number;
  Phicauduong_benbai: string | number; // Cột mới
  Phiruaxe: string | number;           // Cột mới
  ChiPhiBaoDuong_SuaChua: string | number;
  ChiPhiThue_KhauHao: string | number;
  GhiChu: string;
  [key: string]: any;
}

export interface PhapNhan {
  Id_Phapnhan: string;
  ID_DonVi: string;
  TenCongty: string;
  MST: string;
  Diachi: string;
  GPDK: string;
  Mail: string;
  [key: string]: any;
}

export interface PhongHop {
  ID_Phonghop: string; // Lưu ý ở Sheet bạn nên đặt chuẩn là ID_Phonghop nhé
  ID_DonVi: string;
  Tenphonghop: string;
  Vitri: string;
  Succhua: string;
  TBtrinhchieu: string;
  TBHopOnline: boolean;
  Bangviet: boolean;
  Butviet: string;
  Butchi: string;
  TBchuyenslide: boolean;
  Layout: string;
  Ghichu: string;
  [key: string]: any;
}

export interface VanBan {
  ID_VanBan: string;
  ID_DonVi: string;
  Phanloai: string;
  Sohieu: string;
  NgayBanHanh: string;
  TieuDe: string;
  Noidung: string;
  Nguoiky: string;
  Chucvu: string;
  Nguoilayso: string;
  BPlayso: string;
  Phamviapdung: string;
  Hieuluc: string;
  Nghiepvu: string;
  Link_FileDinhKem: string;
  VBthaythe: string; // THÊM DÒNG NÀY
  [key: string]: any;
}

export interface QuyDinhQuyTrinh {
  ID_QDQT: string;
  Phanloai: string;
  Sohieu: string;
  ngayBanHanh: string;
  TieuDe: string;
  Noidung: string;
  Nghiepvu: string;
  linkFile: string;
  [key: string]: any;

}
export interface ThietBi {
  ID_TTB: string;
  ID_DonVi: string;
  MaTaiSan: string;
  TenThietBi: string;
  NhomThietBi: string;
  MoTaDacDiem: string;
  NhaCungCap: string;
  NgayMua: string;
  GiaMua: string;
  HanBaoHanh: string;
  TinhTrang: string;
  Link_HinhAnh: string;
  Link_Hoso: string;
  SoSeri: string;
  CPU: string;
  RAM: string;
  SSD: string;
  HDD: string;
  VGA: string;
  ManHinh: string;
  PhuKien: string;
  [key: string]: any;
}

export interface NhatKyThietBi {
  ID_NKTTB: string;
  ID_TTB: string;
  ID_DonVi: string;
  NgayGhiNhan: string;
  LoaiNhatKy: string;
  ChiPhi: string; // <-- THÊM DÒNG NÀY VÀO ĐÂY
  MSNVNguoiDung_NguoiQL: string;
  HoTenNguoiDung_NguoiQL: string;
  BP_SuDung_QuanLy: string;
  GhiChu_SuaChua_Nangcap: string;
  GhiChu_NhatKySuDung: string;
  [key: string]: any;
}