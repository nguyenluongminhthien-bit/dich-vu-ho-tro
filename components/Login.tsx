
import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, pass: string, remember: boolean) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(false);

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('thaco_remember_email');
    const savedPass = localStorage.getItem('thaco_remember_pass');
    
    if (savedEmail && savedPass) {
      setEmail(savedEmail);
      setPass(savedPass);
      setRemember(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Logic lưu thông tin đăng nhập nếu chọn "Ghi nhớ"
    if (remember) {
      localStorage.setItem('thaco_remember_email', email);
      localStorage.setItem('thaco_remember_pass', pass);
    } else {
      localStorage.removeItem('thaco_remember_email');
      localStorage.removeItem('thaco_remember_pass');
    }

    onLogin(email, pass, remember);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-50 text-[#0061AF] mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Dịch vụ Hỗ trợ</h1>
          <p className="text-sm text-gray-500 mt-2">Đăng nhập hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-yellow-50 text-black focus:ring-2 focus:ring-[#0061AF] focus:border-transparent outline-none transition-all placeholder-gray-400"
              placeholder="name@thaco.com.vn"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mật khẩu</label>
            <input 
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-yellow-50 text-black focus:ring-2 focus:ring-[#0061AF] focus:border-transparent outline-none transition-all placeholder-gray-400"
              placeholder="•••••••"
              required
            />
          </div>

          <div className="flex items-center">
            <input 
              id="remember" 
              type="checkbox" 
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 text-[#0061AF] border-gray-300 rounded focus:ring-[#0061AF]"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">Ghi nhớ đăng nhập</label>
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#0061AF] text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Đăng nhập
          </button>
        </form>
        
        <p className="mt-8 text-center text-xs text-gray-400">
          © 2026 Support Services System
        </p>
      </div>
    </div>
  );
};

export default Login;
