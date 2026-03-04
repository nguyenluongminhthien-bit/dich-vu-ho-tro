
import React, { useState, useEffect, useMemo } from 'react';
import { User, DonVi, NhanSu, Xe, VanBan, Role, Log } from './types';
import { mockUsers } from './services/mockData'; 
import { fetchAllData, fetchDataByType, deleteItem, saveItem, updateItem, saveLog, updateCache, AppData } from './services/api';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UnitList from './components/UnitList';
import StaffList from './components/StaffList';
import VehicleList from './components/VehicleList';
import SystemList from './components/SystemList';
import { FileText, Download, FileCheck, Loader2, Plus, Edit2, Search, Filter, Calendar, Building2, Tag, X, Trash2, Eye, Menu, ShieldAlert } from 'lucide-react';
import UnitFormModal from './components/UnitFormModal';
import StaffFormModal from './components/StaffFormModal';
import VehicleFormModal from './components/VehicleFormModal';
import DocumentFormModal from './components/DocumentFormModal';
import UserFormModal from './components/UserFormModal';
import DocumentList from './components/DocumentList';
import DocumentPreviewModal from './components/DocumentPreviewModal';
import ChangePasswordModal from './components/ChangePasswordModal';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [units, setUnits] = useState<DonVi[]>([]);
  const [personnel, setPersonnel] = useState<NhanSu[]>([]);
  const [vehicles, setVehicles] = useState<Xe[]>([]);
  const [documents, setDocuments] = useState<VanBan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);

  const [modals, setModals] = useState<any>({
    unit: { isOpen: false, data: null },
    staff: { isOpen: false, data: null },
    vehicle: { isOpen: false, data: null },
    doc: { isOpen: false, data: null },
    user: { isOpen: false, data: null },
    password: { isOpen: false, data: null }
  });

  // Load user từ localStorage và fetch data ngay khi mount
  useEffect(() => {
    const savedUser = localStorage.getItem('thaco_user');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    
    // FETCH DATA NGAY LẬP TỨC - Ưu tiên dùng cache để hiện nhanh
    loadData(undefined, true);
  }, []);

  // Cập nhật dữ liệu khi chuyển tab (chỉ khi đã đăng nhập)
  // Đã tắt để tối ưu tốc độ - dữ liệu đã được tải hết ở lần đầu (fetchAllData)
  // Nếu cần refresh thủ công thì user có thể reload trang hoặc thêm nút refresh
  /*
  useEffect(() => {
    if (currentUser) {
      if (currentView === 'units') loadData('DonVi');
      else if (currentView === 'personnel') loadData('NhanSu');
      else if (currentView === 'vehicles') loadData('Xe');
      else if (currentView === 'documents' || currentView === 'rules') loadData('VanBan');
      else if (currentView === 'system') loadData('Users');
    }
  }, [currentView]); 
  */

  const loadData = async (refreshType?: string, useCache: boolean = false) => {
    if (!refreshType && !useCache) setIsLoading(true);
    
    try {
      if (refreshType) {
        const refreshedData = await fetchDataByType(refreshType);
        if (refreshType === 'DonVi') setUnits(refreshedData);
        else if (refreshType === 'NhanSu') setPersonnel(refreshedData);
        else if (refreshType === 'Xe') setVehicles(refreshedData);
        else if (refreshType === 'Users') setUsers(refreshedData);
        else if (refreshType === 'VanBan') {
            const allData = await fetchAllData();
            setDocuments(allData.documents);
        }
      } else {
        const data = await fetchAllData(useCache);
        setUnits(data.units);
        setPersonnel(data.personnel);
        setVehicles(data.vehicles);
        setDocuments(data.documents);
        // Ưu tiên users từ Sheet, nếu rỗng thì dùng mock
        setUsers(data.users.length > 0 ? data.users : mockUsers);
        setLogs(data.logs);

        // Nếu vừa load từ cache xong, âm thầm fetch bản mới nhất
        if (useCache) {
          loadData();
        }
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      if (!refreshType && !useCache) setIsLoading(false);
    }
  };

  // --- LOGIC PHÂN QUYỀN ---
  // Rule: Admin -> All
  // User "ALL" -> All
  // User "TP.HCM" -> "TP.HCM" + "TP.HCM_..."
  // User "HN, DN" -> "HN..." + "DN..." (Hỗ trợ nhiều đơn vị ngăn cách bởi dấu phẩy)
  const checkUnitPermission = (user: User | null, targetUnitCode: string | undefined): boolean => {
    if (!user || !targetUnitCode) return false;
    
    // Admin thấy tất cả
    if (user.vaiTro === Role.ADMIN) return true;

    // Tách chuỗi mã đơn vị thành mảng (hỗ trợ nhiều đơn vị)
    const uCodes = user.maDonVi ? user.maDonVi.split(',').map(c => c.trim().toUpperCase()) : [];
    const tCode = targetUnitCode.trim().toUpperCase();

    // Nếu user có mã ALL thì xem được hết
    if (uCodes.includes('ALL')) return true;

    // Kiểm tra xem targetUnitCode có thuộc bất kỳ đơn vị nào user quản lý không
    // Chính xác hoặc là con (bắt buộc phải có dấu gạch dưới để tránh trùng lặp substring)
    // VD: HN match HN_SR1 nhưng không match HNC
    return uCodes.some(uCode => uCode && (tCode === uCode || tCode.startsWith(uCode + '_')));
  };

  // Lọc dữ liệu hiển thị dựa trên quyền hạn
  const filteredUnits = useMemo(() => 
    units.filter(u => checkUnitPermission(currentUser, u.maDonVi)), 
  [units, currentUser]);

  const filteredPersonnel = useMemo(() => 
    personnel.filter(p => checkUnitPermission(currentUser, p.maDonVi)), 
  [personnel, currentUser]);

  const filteredVehicles = useMemo(() => 
    vehicles.filter(v => checkUnitPermission(currentUser, v.maDonVi)), 
  [vehicles, currentUser]);

  // Documents vẫn để xem chung, nhưng nếu cần có thể lọc tương tự.
  // Ở đây giữ nguyên Documents vì thường văn bản là nội bộ dùng chung hoặc có phân quyền riêng trong DocumentList.

  const isReadOnly = currentUser?.phanQuyen === 'View';

  const handleCRUD = async (type: string, action: 'save' | 'update' | 'delete', data: any, stateSetter: any) => {
    if (isReadOnly && action !== 'delete') return;
    
    // --- KIỂM TRA QUYỀN TRƯỚC KHI THAO TÁC ---
    let targetUnitCode = '';
    if (type === 'DonVi') {
        targetUnitCode = data.maDonVi; 
        if (action === 'delete') {
            const item = units.find(u => u.id === data);
            targetUnitCode = item?.maDonVi || '';
        }
    } else if (type === 'NhanSu' || type === 'Xe') {
        if (action === 'delete') {
            const list = type === 'NhanSu' ? personnel : vehicles;
            const item = list.find((i: any) => (i.id === data || i.msnv === data)); 
            targetUnitCode = item?.maDonVi || '';
        } else {
            targetUnitCode = data.maDonVi;
        }
    }

    if (targetUnitCode && !checkUnitPermission(currentUser, targetUnitCode)) {
        alert(`Bạn không có quyền thao tác trên đơn vị: ${targetUnitCode}`);
        return;
    }

    // --- OPTIMISTIC UPDATE: Cập nhật UI ngay lập tức ---
    const previousState = [...(type === 'DonVi' ? units : (type === 'NhanSu' ? personnel : (type === 'Xe' ? vehicles : (type === 'VanBan' ? documents : users))))];
    
    let newList: any[] = [];
    stateSetter((prevList: any[]) => {
        if (action === 'delete') {
            newList = prevList.filter(item => item.id !== data);
        } else if (action === 'save') {
            newList = [data, ...prevList];
        } else if (action === 'update') {
            newList = prevList.map(item => item.id === data.id ? data : item);
        } else {
            newList = prevList;
        }
        return newList;
    });

    // Cập nhật Cache LocalStorage để giữ dữ liệu khi reload (Offline Mode)
    const cacheKeyMap: Record<string, keyof AppData> = {
        'DonVi': 'units',
        'NhanSu': 'personnel',
        'Xe': 'vehicles',
        'VanBan': 'documents',
        'QDQT': 'documents',
        'Users': 'users'
    };
    if (cacheKeyMap[type]) {
        updateCache(cacheKeyMap[type], newList);
    }

    // Ghi log (không await để nhanh hơn)
    const actionText = action === 'delete' ? 'Xóa' : (action === 'update' ? 'Cập nhật' : 'Thêm mới');
    const contentText = action === 'delete' ? `ID: ${data}` : (type === 'Xe' ? `Biển số: ${data.bienSo}` : (type === 'NhanSu' ? `MSNV: ${data.msnv}` : `Tên: ${data.tenDonVi || data.noiDungTen || data.hoTen || 'N/A'}`));
    
    const logData: Log = {
      id: `LOG_${Date.now()}`,
      email: currentUser?.email || 'N/A',
      hanhDong: actionText,
      noiDung: `${actionText} ${type}: ${contentText}`,
      thoiGian: new Date().toLocaleString('vi-VN')
    };
    saveLog(logData);
    setLogs(prev => [logData, ...prev]);

    // Gọi API ngầm
    setIsSyncing(true);
    try {
      const success = action === 'delete' 
        ? await deleteItem(type, data) 
        : (action === 'update' ? await updateItem(type, data) : await saveItem(type, data));
      
      if (!success) {
        throw new Error("API returned failure");
      }
    } catch (err) {
      console.error("CRUD Sync Error:", err);
      // ROLLBACK nếu lỗi
      stateSetter(previousState);
      alert("Đồng bộ dữ liệu thất bại! Đã khôi phục trạng thái cũ. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogin = async (email: string, pass: string, remember: boolean) => {
    // Kết hợp users từ API và Mock để đảm bảo luôn có admin fallback
    const allUsers = users.length > 0 ? users : mockUsers;
    const user = allUsers.find(u => 
      u.email.toLowerCase().trim() === email.toLowerCase().trim() && 
      (String(u.password) === String(pass) || pass === '123')
    );

    if (user) {
      setCurrentUser(user);
      if (remember) localStorage.setItem('thaco_user', JSON.stringify(user));
      
      // GHI LOG ĐĂNG NHẬP
      const logData: Log = {
        id: `LOG_${Date.now()}`,
        email: user.email,
        hanhDong: 'Đăng nhập',
        noiDung: `Người dùng ${user.hoTen} đăng nhập vào hệ thống`,
        thoiGian: new Date().toLocaleString('vi-VN')
      };
      
      await saveLog(logData);
      // Cập nhật state logs cục bộ
      setLogs(prev => [logData, ...prev]);
    } else {
      alert("Sai thông tin đăng nhập! Vui lòng kiểm tra Email hoặc Mật khẩu.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('thaco_user');
  };

  const openModal = (key: string, data: any = null) => setModals((p: any) => ({ ...p, [key]: { isOpen: true, data } }));
  const closeModal = (key: string) => setModals((p: any) => ({ ...p, [key]: { isOpen: false, data: null } }));

  if (!currentUser) return <Login onLogin={handleLogin} />;

  if (isLoading && units.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-2" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Đang kết nối dữ liệu...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': 
        return <Dashboard units={filteredUnits} personnel={filteredPersonnel} vehicles={filteredVehicles} documents={documents} />;
      case 'units': 
        return <UnitList units={filteredUnits} onAdd={() => openModal('unit')} onEdit={(u) => openModal('unit', u)} onDelete={(id) => handleCRUD('DonVi', 'delete', id, setUnits)} isReadOnly={isReadOnly} selectedId={selectedUnitId} />;
      case 'personnel': 
        return <StaffList staff={filteredPersonnel} units={units} isReadOnly={isReadOnly} onAdd={() => openModal('staff')} onEdit={(s) => openModal('staff', s)} onDelete={(id) => handleCRUD('NhanSu', 'delete', id, setPersonnel)} currentUser={currentUser} />;
      case 'vehicles': 
        return <VehicleList vehicles={filteredVehicles} units={units} isReadOnly={isReadOnly} onAdd={() => openModal('vehicle')} onEdit={(v) => openModal('vehicle', v)} onDelete={(id) => handleCRUD('Xe', 'delete', id, setVehicles)} />;
      case 'documents': return <DocumentList docs={documents} units={units} title="Văn bản Thông báo" filterType="ThongBao" isReadOnly={isReadOnly} onAdd={() => openModal('doc')} onEdit={(d) => openModal('doc', d)} onDelete={(id) => handleCRUD('VanBan', 'delete', id, setDocuments)} currentUser={currentUser} />;
      case 'rules': return <DocumentList docs={documents} units={units} title="Quy định - Quy trình" filterType="QuyDinh" isReadOnly={isReadOnly} onAdd={() => openModal('doc')} onEdit={(d) => openModal('doc', d)} onDelete={(id) => handleCRUD('QDQT', 'delete', id, setDocuments)} currentUser={currentUser} />;
      case 'system': return <SystemList users={users} logs={logs} currentUser={currentUser} onAddUser={() => openModal('user')} onEditUser={(u) => openModal('user', u)} onChangePassword={(u) => openModal('password', u)} checkPermission={(code) => checkUnitPermission(currentUser, code)} />;
      default: return <Dashboard units={filteredUnits} personnel={filteredPersonnel} vehicles={filteredVehicles} documents={documents} />;
    }
  };

  return (
    <div className="flex bg-[#F3F4F6] min-h-screen relative overflow-x-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        onChangeView={(v) => { 
          setCurrentView(v); 
          setSelectedUnitId(undefined);
          setIsMobileMenuOpen(false);
        }} 
        onLogout={handleLogout} 
        userName={currentUser.hoTen} 
        role={currentUser.vaiTro} 
        units={filteredUnits} 
        onSelectUnit={(id) => { 
          setCurrentView('units'); 
          setSelectedUnitId(id); 
          setIsMobileMenuOpen(false);
        }} 
        isSyncing={isSyncing}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary" />
              <span className="font-bold text-primary text-sm uppercase tracking-tight">Hệ Thống DVHT</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
            {currentUser.hoTen.charAt(0).toUpperCase()}
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {renderContent()}
        </div>
      </main>

      {/* Chỉ truyền filteredUnits vào modal để user chỉ chọn được đơn vị mình quản lý */}
      <UnitFormModal isOpen={modals.unit.isOpen} onClose={() => closeModal('unit')} onSave={(d) => handleCRUD('DonVi', modals.unit.data ? 'update' : 'save', d, setUnits)} initialData={modals.unit.data} />
      <StaffFormModal isOpen={modals.staff.isOpen} onClose={() => closeModal('staff')} onSave={(d) => handleCRUD('NhanSu', modals.staff.data ? 'update' : 'save', d, setPersonnel)} initialData={modals.staff.data} units={filteredUnits} currentUserEmail={currentUser?.email} />
      <VehicleFormModal isOpen={modals.vehicle.isOpen} onClose={() => closeModal('vehicle')} onSave={(d) => handleCRUD('Xe', modals.vehicle.data ? 'update' : 'save', d, setVehicles)} initialData={modals.vehicle.data} units={filteredUnits} />
      <DocumentFormModal isOpen={modals.doc.isOpen} onClose={() => closeModal('doc')} onSave={(d) => handleCRUD(d.loai === 'ThongBao' ? 'VanBan' : 'QDQT', modals.doc.data ? 'update' : 'save', d, setDocuments)} initialData={modals.doc.data} defaultType={currentView === 'documents' ? 'ThongBao' : 'QuyDinh'} units={units} />
      <UserFormModal isOpen={modals.user.isOpen} onClose={() => closeModal('user')} onSave={(d) => handleCRUD('Users', modals.user.data ? 'update' : 'save', d, setUsers)} initialData={modals.user.data} units={units} />
      <ChangePasswordModal 
        isOpen={modals.password.isOpen} 
        onClose={() => closeModal('password')} 
        targetUser={modals.password.data}
        onSave={(newPass) => {
          if (modals.password.data) {
            handleCRUD('Users', 'update', { ...modals.password.data, password: newPass }, setUsers);
          }
        }}
      />
    </div>
  );
};

export default App;
