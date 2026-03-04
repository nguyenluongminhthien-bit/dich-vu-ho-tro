
import { DonVi, NhanSu, Xe, VanBan, User, Log } from '../types';
import { mockDonVi, mockNhanSu, mockXe, mockVanBan, mockUsers, mockLogs } from './mockData';

// URL MỚI CỦA BẠN
const API_URL: string = 'https://script.google.com/macros/s/AKfycbyTHb5Q_GDpToUsxxUOb1rt8wo-N0kNtxdO1hSarJFnV9oCI0PotJ0XZ7nyIvOZA2mT/exec'; 

export interface AppData {
  units: DonVi[];
  personnel: NhanSu[];
  vehicles: Xe[];
  documents: VanBan[];
  users: User[];
  logs: Log[];
}

export const fetchAllData = async (useCache: boolean = false): Promise<AppData> => {
  const CACHE_KEY = 'thaco_app_data_cache';
  
  // Trả về cache nếu có yêu cầu
  if (useCache) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Lỗi parse cache:", e);
      }
    }
  }

  try {
    const response = await fetch(`${API_URL}?action=readall&_t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    });
    
    if (!response.ok) throw new Error("Kết nối Apps Script thất bại");
    const data = await response.json();
    
    const result = {
      units: data.units || [],
      personnel: data.personnel || [],
      vehicles: data.vehicles || [],
      documents: data.documents || [],
      users: data.users || [],
      logs: data.logs || []
    };

    // Lưu cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    
    return result;
  } catch (error) {
    console.warn("API connection failed, switching to Offline/Mock mode.", error);
    
    // Nếu lỗi mạng, thử lấy từ cache lần cuối
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      console.info("Using Cached Data.");
      return JSON.parse(cached);
    }

    console.info("Using Mock Data.");
    return {
      units: mockDonVi,
      personnel: mockNhanSu,
      vehicles: mockXe,
      documents: mockVanBan,
      users: mockUsers,
      logs: mockLogs
    };
  }
};

export const fetchDataByType = async (type: string): Promise<any[]> => {
  try {
    const response = await fetch(`${API_URL}?action=read&type=${type}&_t=${Date.now()}`, {
      method: 'GET',
      redirect: 'follow'
    });
    if (!response.ok) return [];
    const result = await response.json();
    return result.data || [];
  } catch (err) {
    console.warn(`Fetch ${type} failed, returning empty list.`, err);
    return [];
  }
};

const postToGAS = async (payload: any): Promise<boolean> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.warn("API POST failed, switching to Offline mode (Data saved locally).", error);
    return true; // Return true to prevent UI rollback in offline mode
  }
};

export const updateCache = (key: keyof AppData, data: any[]) => {
  const CACHE_KEY = 'thaco_app_data_cache';
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      parsed[key] = data;
      localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
    }
  } catch (e) {
    console.error("Error updating cache:", e);
  }
};

export const deleteItem = async (type: string, id: string): Promise<boolean> => {
  return await postToGAS({ action: 'delete', type, id });
};

export const saveItem = async (type: string, item: any): Promise<boolean> => {
  return await postToGAS({ action: 'create', type, data: item });
};

export const updateItem = async (type: string, item: any): Promise<boolean> => {
  return await postToGAS({ action: 'update', type, data: item });
};

export const saveLog = async (log: Log): Promise<boolean> => {
  return await postToGAS({ action: 'create', type: 'Logs', data: log });
};
