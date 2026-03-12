
import { DonVi, NhanSu, Xe, VanBan, User, Role, Log } from '../types';

export const mockUsers: User[] = [
  {
    email: 'admin@thaco.com.vn',
    hoTen: 'Nguyễn Lương Minh Thiện',
    vaiTro: Role.ADMIN,
    maDonVi: 'HO',
    phanQuyen: 'All',
    password: '123' 
  },
  {
    email: 'user@thaco.com.vn',
    hoTen: 'Nhân viên VP',
    vaiTro: Role.CTY,
    maDonVi: 'HCM',
    phanQuyen: 'View',
    password: '123'
  },
  {
    email: 'sr@thaco.com.vn',
    hoTen: 'Giám đốc SR',
    vaiTro: Role.SR,
    maDonVi: 'DNA',
    phanQuyen: 'View',
    password: '123'
  }
];

export const mockLogs: Log[] = [
  {
    id: 'L001',
    thoiGian: '2024-05-20 08:30:00',
    email: 'admin@thaco.com.vn',
    hanhDong: 'Đăng nhập',
    noiDung: 'Đăng nhập hệ thống thành công'
  },
  {
    id: 'L002',
    thoiGian: '2024-05-20 09:15:00',
    email: 'admin@thaco.com.vn',
    hanhDong: 'Cập nhật',
    noiDung: 'Cập nhật thông tin đơn vị HCM'
  },
  {
    id: 'L003',
    thoiGian: '2024-05-20 10:00:00',
    email: 'user@thaco.com.vn',
    hanhDong: 'Xem',
    noiDung: 'Tra cứu danh sách xe'
  }
];

export const mockDonVi: DonVi[] = [
  {
    id: '1',
    mien: 'CTy TT Phía Nam',
    tenDonVi: 'THACO AUTO TP.HCM',
    maDonVi: 'HCM',
    maCapTren: 'HO',
    diaChi: 'Số 2, Đường số 13, Phường An Khánh, TP.HCM',
    loaiHinh: 'Văn phòng',
    soCong: 2,
    dienTich: 5000,
    ham: 1,
    tang: 5,
    phongCho: 3,
    luotKhachTB: 140,
    ldDonVi: 'PCT TT',
    hoTenLD: 'Nguyễn Thiện Mỹ',
    sdtLD: '0901123456',
    mailLD: 'nguyenthienmy@thaco.com.vn',
    
    cdLanhDaoKdx: 'Giám đốc KD xe',
    hoTenLdKdx: 'Lê Hoàng Nam',
    sdtLdKdx: '0901222333',
    mailLdKdx: 'lehoangnam@thaco.com.vn',
    
    cdLanhDaoDvpt: 'Giám đốc DVPT',
    hoTenLdDvpt: 'Phạm Minh Tuấn',
    sdtLdDvpt: '0901444555',
    mailLdDvpt: 'phamminhtuan@thaco.com.vn',

    sdtDvht1: '0938809294',
    mailDvht1: 'nguyentrandinh@thaco.com.vn',
    dvhtKd2: 'PT Nhân sự',
    hoTenDvht2: 'Trần Thị B',
    sdtDvht2: '0909555666',
    mailDvht2: 'tranthib@thaco.com.vn',
    
    tongNsAnBv: 7,
    tongNsPvhc: 7,
    slAnBvNoiBo: 5,
    slAnBvDichVu: 2,
    slPvhcKhach: 3,
    slPvhcVs: 4,
    soCbNv: 140,
    trangThai: 'Hoạt động',
    phuonganpctt: '#',
    phuonganpccn: '#',
    phuongAnAnBv: '#',
    thuctrangANBV: 'Ổn định, kiểm soát tốt ra vào.',
    phop1: true,
    vitriPhop1: 'Phòng họp 1 - Tầng 2',
    scPhop1: 20,
    manPhop1: 'TV 65 inch',
    onlinePhop1: true,
    layout1: '#',
    phop2: false,
    phop3: false,
    phop4: false,
    phop5: false
  },
  {
    id: '2',
    mien: 'CTy TT Phía Nam',
    tenDonVi: 'THACO AUTO Đồng Nai',
    maDonVi: 'DNA',
    maCapTren: 'HCM', // Changed from HO to HCM to demonstrate hierarchy
    diaChi: 'Xa lộ Hà Nội, Biên Hòa, Đồng Nai',
    loaiHinh: 'Showroom',
    soCong: 1,
    dienTich: 3200,
    ham: 0,
    tang: 2,
    phongCho: 1,
    luotKhachTB: 45,
    ldDonVi: 'Giám đốc SR',
    hoTenLD: 'Trần Văn A',
    sdtLD: '0909111222',
    mailLD: 'tranvana@thaco.com.vn',
    sdtDvht1: '0909333444',
    mailDvht1: 'levanb@thaco.com.vn',
    tongNsAnBv: 5,
    tongNsPvhc: 3,
    slAnBvNoiBo: 2,
    slAnBvDichVu: 3,
    slPvhcKhach: 1,
    slPvhcVs: 2,
    soCbNv: 45,
    trangThai: 'Hoạt động',
    phuonganpctt: '#',
    phuonganpccn: '#',
    phuongAnAnBv: '#',
    thuctrangANBV: 'Cần bổ sung camera khu vực xưởng.'
  },
  {
    id: '3',
    mien: 'CTy TT Phía Bắc',
    tenDonVi: 'THACO AUTO Hà Nội',
    maDonVi: 'HAN',
    maCapTren: 'HO',
    diaChi: 'Giải Phóng, Hà Nội',
    loaiHinh: 'Văn phòng',
    soCong: 3,
    dienTich: 6000,
    ham: 2,
    tang: 8,
    phongCho: 4,
    luotKhachTB: 200,
    ldDonVi: 'Tổng Giám đốc',
    hoTenLD: 'Phạm Văn C',
    sdtLD: '0988777666',
    mailLD: 'phamvanc@thaco.com.vn',
    sdtDvht1: '0912345678',
    mailDvht1: 'dothid@thaco.com.vn',
    tongNsAnBv: 15,
    tongNsPvhc: 11,
    slAnBvNoiBo: 10,
    slAnBvDichVu: 5,
    slPvhcKhach: 5,
    slPvhcVs: 6,
    soCbNv: 250,
    trangThai: 'Hoạt động',
    phuonganpctt: '#',
    phuonganpccn: '#',
    phuongAnAnBv: '#',
    thuctrangANBV: 'Tốt.'
  }
];

export const mockNhanSu: NhanSu[] = [
  {
    // Adding missing mandatory property id
    id: 'NS001',
    msnv: 'NV001',
    hoTen: 'Nguyễn Văn Bảo',
    gioiTinh: 'Nam',
    ngaySinh: '12/05/1990',
    tuoi: 34,
    maDonVi: 'HCM',
    maCapTren: 'HO',
    viTri: 'Nhân viên Bảo vệ',
    ngayVaoLam: '01/01/2015',
    trinhDo: 'Đại học',
    thamNienBV: 9,
    atvsld: true,
    anbv: true,
    pccc: true,
    chcn: false,
    soCapCuu: true,
    cpr: false,
    voThuat: false,
    gplx: 'B2',
    ghiChu: '',
    sdt: '0901234567',
    email: 'nguyenvanbao@thaco.com.vn'
  },
  {
    // Adding missing mandatory property id
    id: 'NS002',
    msnv: 'NV002',
    hoTen: 'Lê Thị Hoa',
    gioiTinh: 'Nữ',
    ngaySinh: '20/10/1995',
    tuoi: 29,
    maDonVi: 'DNA',
    maCapTren: 'HO',
    viTri: 'Tổ trưởng',
    ngayVaoLam: '15/06/2018',
    trinhDo: 'Cao đẳng',
    thamNienBV: 6,
    atvsld: true,
    anbv: false,
    pccc: true,
    chcn: false,
    soCapCuu: true,
    cpr: true,
    voThuat: false,
    gplx: 'A1',
    ghiChu: '',
    sdt: '0909876543',
    email: 'lethihoa@thaco.com.vn'
  }
];

export const mockXe: Xe[] = [
  {
    id: 'X001',
    maDonVi: 'HCM',
    maCapTren: 'HO',
    mucDichSuDung: 'Đưa đón lãnh đạo',
    maTaiSan: 'TS-001',
    hinhThucSoHuu: 'Quản lý sử dụng',
    donViChuSoHuu: 'THACO',
    nguyenGia: 1200000000,
    chiPhiThueKhauHao: 10000000,
    phanNhanChiuChiPhi: 'VP',
    loaiPhuongTien: 'Ô tô du lịch',
    hieuXe: 'Kia',
    loaiXe: 'Carnival',
    bienSo: '51H-123.45',
    namSX: 2022,
    namDK: 2022,
    soCho: 7,
    loaiNhienLieu: 'Dầu',
    dungTich: '2.2L',
    congThucBanh: '4x2',
    mauXe: 'Trắng',
    soKhung: 'K12345',
    soMay: 'M12345',
    kmHienTai: 15000,
    tanSuat: 'Thường xuyên',
    nlSuDungTrongThang: 150,
    chiPhiNguyenLieu: 3000000,
    gps: true,
    hienTrang: 'Bình thường',
    ghiChu: ''
  }
];

export const mockVanBan: VanBan[] = [
  {
    id: 'TB001',
    loai: 'ThongBao',
    loaiVanBan: 'Thông báo',
    soHieu: '123/TB-THACO',
    ngayBanHanh: '10/01/2024',
    noiDungTen: 'Về việc nghỉ tết Nguyên Đán 2024',
    nguoiKy: 'Tổng Giám Đốc',
    linkFile: '#'
  },
  {
    id: 'QD001',
    loai: 'QuyDinh',
    dmQuyTrinh: 'AN-BV',
    soHieu: '01/QD-ANBV',
    ngayBanHanh: '01/01/2023',
    noiDungTen: 'Quy trình kiểm soát ra vào cổng',
    linkFile: '#'
  }
];
