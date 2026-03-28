import { DonVi } from '../types';

// 1. Hàm tự động cấp Icon (Emoji) dùng cho các danh sách xổ xuống (Select)
export const getUnitEmoji = (loaiHinh?: string) => {
  // Dùng .trim() để xóa khoảng trắng thừa từ Google Sheets
  const lower = String(loaiHinh || '').toLowerCase().trim();
  if (lower.includes('tổng công ty')) return '🏢';
  if (lower.includes('công ty tỉnh')) return '🏪';
  if (lower.includes('quản trị')) return '🏪';
  if (lower.includes('showroom')) return '🏬';
  if (lower.includes('điểm kinh doanh')) return '📍';
  if (lower.includes('kho')) return '🏭';
  return '🏢';
};

// 2. Thuật toán Đệ quy vẽ nhánh cây
export const buildHierarchicalOptions = (units: DonVi[]) => {
  const result: { unit: DonVi; prefix: string }[] = [];
  const unitIds = new Set(units.map(u => u.ID_DonVi));
  
  // Tìm các đơn vị Cấp 0 (Root)
  const roots = units.filter(u => !u.CapQuanLy || u.CapQuanLy === 'HO' || !unitIds.has(u.CapQuanLy));

  const BRANCH = '├──\xA0';
  const LAST_BRANCH = '└──\xA0';
  const VERTICAL = '│\xA0\xA0\xA0';
  const EMPTY = '\xA0\xA0\xA0\xA0';

  const buildTree = (nodes: DonVi[], prefixStr: string) => {
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const nodePrefix = prefixStr ? prefixStr + (isLast ? LAST_BRANCH : BRANCH) : '';
      result.push({ unit: node, prefix: nodePrefix });
      
      const children = units.filter(u => u.CapQuanLy === node.ID_DonVi);
      if (children.length > 0) {
        const childPrefix = prefixStr ? prefixStr + (isLast ? EMPTY : VERTICAL) : '\xA0';
        buildTree(children, childPrefix);
      }
    });
  };

  buildTree(roots, '');
  return result;
};