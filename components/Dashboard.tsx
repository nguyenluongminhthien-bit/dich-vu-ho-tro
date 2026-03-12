
import React, { useMemo, useState } from 'react';
import { DonVi, NhanSu, Xe, VanBan } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Building, Car, FileText, Mail, Copy, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  units: DonVi[];
  personnel: NhanSu[];
  vehicles: Xe[];
  documents: VanBan[];
}

const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType; color: string; action?: React.ReactNode }> = ({ title, value, icon: Icon, color, action }) => (
  <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-xs md:text-sm text-gray-500 font-medium truncate">{title}</p>
        {action}
      </div>
      <h3 className="text-xl md:text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 md:p-4 rounded-full ${color} shrink-0`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
    </div>
  </div>
);

const COLORS = ['#0061AF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'];

const Dashboard: React.FC<DashboardProps> = ({ units, personnel, vehicles, documents }) => {
  const [copyStatus, setCopyStatus] = useState<'LD' | 'DVHT' | 'HR' | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const handleCopyEmails = (type: 'LD' | 'DVHT' | 'HR') => {
    let sourceEmails: (string | undefined | null)[] = [];

    if (type === 'HR') {
      // Condition: MaCapTren là HO và dvhtKd2 là Đầu mối HR.
      sourceEmails = units
        .filter(u => u.maCapTren === 'HO' && u.dvhtKd2 === 'Đầu mối HR')
        .map(u => u.mailDvht2);
    } else {
      const officeUnits = units.filter(u => u.loaiHinh === 'Văn phòng');
      sourceEmails = officeUnits.map(u => type === 'LD' ? u.mailLD : u.mailDvht1);
    }

    const emails = sourceEmails
      .filter(email => email && email.trim() !== '' && email !== '#')
      .map(email => email!.trim());

    // Loại bỏ email trùng lặp
    const uniqueEmails = Array.from(new Set(emails)).join('; ');

    if (uniqueEmails) {
      navigator.clipboard.writeText(uniqueEmails);
      setCopyStatus(type);
      setTimeout(() => setCopyStatus(null), 2000);
    } else {
      alert('Không tìm thấy dữ liệu email phù hợp.');
    }
  };
  
  const availableYears = useMemo(() => {
    const years = documents
      .map(d => {
        if (!d.ngayBanHanh) return null;
        const parts = String(d.ngayBanHanh).split('/');
        return parts.length === 3 ? parseInt(parts[2]) : null;
      })
      .filter((y): y is number => y !== null && !isNaN(y));
    const uniqueYears = Array.from(new Set(years)).sort((a: number, b: number) => b - a);
    if (!uniqueYears.includes(currentYear)) uniqueYears.unshift(currentYear);
    return uniqueYears;
  }, [documents, currentYear]);

  const notificationCount = useMemo(() => {
    return documents.filter(d => {
      if (d.loaiVanBan !== 'Thông báo') return false;
      const year = d.ngayBanHanh ? parseInt(String(d.ngayBanHanh).split('/')[2]) : null;
      return year === selectedYear;
    }).length;
  }, [documents, selectedYear]);

  const personnelByUnit = useMemo(() => {
    const data: {[key: string]: number} = {};
    personnel.forEach(p => {
      const parentCode = p.maCapTren === 'HO' ? p.maDonVi : (p.maCapTren || p.maDonVi);
      const parentUnit = units.find(u => u.maDonVi === parentCode);
      const name = parentUnit?.tenDonVi || parentCode || 'Khác';
      data[name] = (data[name] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, count: data[key] })).sort((a, b) => b.count - a.count);
  }, [personnel, units]);

  const vehicleByType = useMemo(() => {
    const data: {[key: string]: number} = {};
    vehicles.forEach(v => {
      if (v.loaiPhuongTien) {
        data[v.loaiPhuongTien] = (data[v.loaiPhuongTien] || 0) + 1;
      }
    });
    return Object.keys(data).map(key => ({ name: key, value: data[key] }));
  }, [vehicles]);

  const vehicleByCompany = useMemo(() => {
    const data: {[key: string]: number} = {};
    vehicles.forEach(v => {
      const parentCode = v.maCapTren === 'HO' ? v.maDonVi : (v.maCapTren || v.maDonVi);
      const parentUnit = units.find(u => u.maDonVi === parentCode);
      const name = parentUnit?.tenDonVi || parentCode || 'Khác';
      data[name] = (data[name] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, count: data[key] })).sort((a, b) => b.count - a.count);
  }, [vehicles, units]);

  const vehicleByBrand = useMemo(() => {
    const data: {[key: string]: number} = {};
    vehicles.forEach(v => {
      const brand = v.hieuXe || 'Khác';
      data[brand] = (data[brand] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, count: data[key] })).sort((a, b) => b.count - a.count);
  }, [vehicles]);

  const vehicleByPurpose = useMemo(() => {
    const data: {[key: string]: number} = {};
    vehicles.forEach(v => {
      const purpose = v.mucDichSuDung || 'Chưa xác định';
      data[purpose] = (data[purpose] || 0) + 1;
    });
    return Object.keys(data).map(key => ({ name: key, count: data[key] })).sort((a, b) => b.count - a.count);
  }, [vehicles]);

  const activeShowroomsCount = useMemo(() => {
    return units.filter(u => 
      u.loaiHinh === 'Showroom' &&
      u.trangThai === 'Hoạt động'
    ).length;
  }, [units]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Tổng quan</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <button 
            onClick={() => handleCopyEmails('LD')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border w-full sm:w-auto ${
              copyStatus === 'LD' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-primary border-primary/20 hover:bg-blue-50 hover:border-primary/40'
            }`}
          >
            {copyStatus === 'LD' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Mail className="w-4 h-4 shrink-0" />}
            <span className="truncate">{copyStatus === 'LD' ? 'Đã copy Mail LĐ' : 'Copy mail LĐ CTy'}</span>
          </button>

          <button 
            onClick={() => handleCopyEmails('DVHT')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border w-full sm:w-auto ${
              copyStatus === 'DVHT' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200'
            }`}
          >
            {copyStatus === 'DVHT' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
            <span className="truncate">{copyStatus === 'DVHT' ? 'Đã copy Mail PT' : 'Copy mail PT DVHT KD'}</span>
          </button>

          <button 
            onClick={() => handleCopyEmails('HR')}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-lg text-sm font-semibold transition-all shadow-sm border w-full sm:w-auto ${
              copyStatus === 'HR' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-white text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200'
            }`}
          >
            {copyStatus === 'HR' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Users className="w-4 h-4 shrink-0" />}
            <span className="truncate">{copyStatus === 'HR' ? 'Đã copy Mail HR' : 'Copy mail HR Đầu mối'}</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Tổng Đơn vị" value={activeShowroomsCount} icon={Building} color="bg-blue-500" />
        <StatCard title="Tổng Nhân sự" value={personnel.length} icon={Users} color="bg-emerald-500" />
        <StatCard title="Tổng Xe" value={vehicles.length} icon={Car} color="bg-orange-500" />
        <StatCard 
          title="Thông báo ban hành" 
          value={notificationCount} 
          icon={FileText} 
          color="bg-indigo-500"
          action={
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-[10px] sm:text-xs border border-gray-200 rounded p-1 bg-gray-50 outline-none focus:border-primary cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] sm:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Thống kê nhân sự theo Đơn vị</h3>
          <div style={{ width: '100%', height: '280px' }}>
            {personnelByUnit.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={personnelByUnit} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Nhân sự">
                    {personnelByUnit.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Chưa có dữ liệu nhân sự</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] sm:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Cơ cấu Phương tiện</h3>
          <div style={{ width: '100%', height: '280px' }}>
            {vehicleByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                  <Pie
                    data={vehicleByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {vehicleByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Chưa có dữ liệu phương tiện</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] sm:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Xem theo đơn vị (Phương tiện)</h3>
          <div style={{ width: '100%', height: '280px' }}>
            {vehicleByCompany.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={vehicleByCompany} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={9} tickLine={false} axisLine={false} width={70} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Số lượng xe">
                    {vehicleByCompany.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] sm:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Xe theo Thương hiệu</h3>
          <div style={{ width: '100%', height: '280px' }}>
            {vehicleByBrand.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={vehicleByBrand} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Số lượng xe">
                    {vehicleByBrand.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 min-h-[350px] sm:min-h-[400px]">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">Xe theo Mục đích sử dụng</h3>
          <div style={{ width: '100%', height: '280px' }}>
            {vehicleByPurpose.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={vehicleByPurpose} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" fontSize={9} tickLine={false} axisLine={false} width={90} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Số lượng xe">
                    {vehicleByPurpose.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
