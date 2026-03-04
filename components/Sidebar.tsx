
import React, { useState } from 'react';
import { 
  Building2, Users, Car, FileText, LayoutDashboard, Settings, LogOut,
  ChevronRight, ShieldAlert, ChevronDown, FileCheck, Menu, Loader2, X
} from 'lucide-react';
import { DonVi, Role } from '../types';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  onLogout: () => void;
  userName: string;
  role: string;
  units: DonVi[];
  onSelectUnit: (unitId: string) => void;
  isSyncing?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onChangeView, onLogout, userName, role, units, onSelectUnit, 
  isSyncing = false, isOpen = false, onClose
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Kiểm tra quyền Admin linh hoạt (không phân biệt hoa/thường)
  const isAdmin = String(role || '').toLowerCase() === 'admin';
  
  const safeName = String(userName || 'User').trim();
  const displayChar = safeName.length > 0 ? safeName.charAt(0).toUpperCase() : '?';

  return (
    <div className={`
      bg-white h-screen shadow-lg flex flex-col fixed lg:sticky top-0 z-50 transition-all duration-300 border-r border-gray-100 flex-shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      ${isCollapsed ? 'lg:w-20' : 'lg:w-72 w-72'}
    `}>
      <div className="p-4 border-b border-gray-100 flex items-center justify-between h-16">
        {(!isCollapsed || isOpen) && (
          <div className="flex items-center gap-3 overflow-hidden">
            <ShieldAlert className="w-8 h-8 text-primary shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-primary leading-none uppercase">Hệ Thống</h1>
              <h2 className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">DỊCH VỤ HỖ TRỢ</h2>
            </div>
          </div>
        )}
        <button 
          onClick={() => {
            if (window.innerWidth < 1024 && onClose) {
              onClose();
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }} 
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <div className={`mx-4 mt-4 mb-2 flex items-center gap-3 ${(isCollapsed && !isOpen) ? 'justify-center' : 'p-3 bg-blue-50 rounded-xl'}`}>
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm">
          {displayChar}
        </div>
        {(!isCollapsed || isOpen) && (
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 truncate">{safeName}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        <MenuItem icon={LayoutDashboard} label="Dashboard" active={currentView === 'dashboard'} onClick={() => onChangeView('dashboard')} collapsed={isCollapsed && !isOpen} />
        <MenuItem icon={Building2} label="Thaco Auto tỉnh thành" active={currentView === 'units'} onClick={() => onChangeView('units')} collapsed={isCollapsed && !isOpen}/>
        <MenuItem icon={Users} label="Quản lý NS DVHT" active={currentView === 'personnel'} onClick={() => onChangeView('personnel')} collapsed={isCollapsed && !isOpen} />
        <MenuItem icon={Car} label="Quản lý Xe" active={currentView === 'vehicles'} onClick={() => onChangeView('vehicles')} collapsed={isCollapsed && !isOpen} />
        
        {/* Hiển thị cho tất cả người dùng (Phân quyền Xem/Sửa xử lý trong Component) */}
        <MenuItem icon={FileText} label="Quản lý Văn bản" active={currentView === 'documents'} onClick={() => onChangeView('documents')} collapsed={isCollapsed && !isOpen} />
        
        <MenuItem icon={FileCheck} label="Quy định - Quy trình" active={currentView === 'rules'} onClick={() => onChangeView('rules')} collapsed={isCollapsed && !isOpen} />
        
        {/* Chỉ Admin mới thấy menu Hệ thống */}
        {isAdmin && (
          <MenuItem icon={Settings} label="Hệ thống" active={currentView === 'system'} onClick={() => onChangeView('system')} collapsed={isCollapsed && !isOpen} />
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        {isSyncing && (
          <div className="flex items-center gap-2 px-4 py-2 mb-2 text-[10px] font-bold text-amber-600 bg-amber-50 rounded-lg animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            {(!isCollapsed || isOpen) && "ĐANG ĐỒNG BỘ..."}
          </div>
        )}
        <button onClick={onLogout} className={`w-full flex items-center ${(isCollapsed && !isOpen) ? 'justify-center' : 'gap-3 px-4'} py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50`}>
          <LogOut className="w-5 h-5" /> {(!isCollapsed || isOpen) && "Đăng xuất"}
        </button>
      </div>
    </div>
  );
};

const MenuItem = ({ icon: Icon, label, active, onClick, collapsed }: any) => (
  <button onClick={onClick} className={`w-full flex items-center ${collapsed ? 'justify-center' : 'px-3'} py-2.5 text-sm font-medium rounded-lg transition-all ${active ? 'bg-primary text-white shadow-md shadow-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}>
    <div className="flex items-center gap-3">
      <Icon className="w-5 h-5" />
      {!collapsed && <span className="truncate">{label}</span>}
    </div>
  </button>
);

export default Sidebar;
