const deptTabStats = useMemo(() => {
   const deptMap: Record<string, Record<string, number>> = {};
   const deptListMap: Record<string, Record<string, any[]>> = {};
   const phanLoaiSet = new Set<string>();

   uniqueActiveStaff.forEach(p => {
     const pb = p.phong_ban?.trim() || 'Chưa phân bổ';
     const pl = p.phan_loai?.trim() || 'Chưa phân loại';
     phanLoaiSet.add(pl);

     if (!deptMap[pb]) { deptMap[pb] = { total: 0 }; deptListMap[pb] = { total: [] }; }
     if (!deptMap[pb][pl]) { deptMap[pb][pl] = 0; deptListMap[pb][pl] = []; }

     deptMap[pb][pl]++;
     deptMap[pb].total++;
     deptListMap[pb][pl].push(p);
     deptListMap[pb].total.push(p);
   });

   const groups = [
     { id: 'quan_ly', label: 'CẤP QUẢN LÝ', color: 'bg-orange-50/30', headerColor: 'bg-orange-100 text-orange-800 border-orange-200', roles: ['Lãnh đạo', 'Chủ tịch', 'Tổng Giám đốc', 'Phó Tổng Giám đốc', 'Giám đốc', 'Phó Giám đốc', 'Trưởng phòng', 'Trưởng bộ phận', 'Phó phòng'] },
     { id: 'giam_sat', label: 'CẤP GIÁM SÁT', color: 'bg-amber-50/20', headerColor: 'bg-amber-100 text-amber-800 border-amber-200', roles: ['Trợ lý', 'Trưởng nhóm', 'Tổ trưởng', 'Tổ phó'] },
     { id: 'chuyen_vien', label: 'CHUYÊN MÔN', color: 'bg-blue-50/20', headerColor: 'bg-blue-100 text-blue-800 border-blue-200', roles: ['Chuyên viên'] },
     { id: 'ho_tro', label: 'DỊCH VỤ HỖ TRỢ', color: 'bg-emerald-50/20', headerColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', roles: ['PT DVHT KD', 'PT DVHC', 'PT NS', 'BV, ĐTKH'] },
     { id: 'nhan_vien', label: 'NGHIỆP VỤ', color: 'bg-blue-50/20', headerColor: 'bg-blue-100 text-blue-800 border-blue-200', roles: ['Nhân viên'] },
     { id: 'khac', label: 'KHÁC', color: 'bg-gray-50/50', headerColor: 'bg-gray-100 text-gray-600 border-gray-200', roles: ['Chưa phân loại'] }
   ];

   const activeColumnsByGroup = groups.map(g => {
     const activeRoles = g.roles.filter(r => phanLoaiSet.has(r));
     return { ...g, activeRoles };
   }).filter(g => g.activeRoles.length > 0);

   const rows = Object.keys(deptMap).sort((a, b) => {
     const getPriority = (name: string) => {
       const lowerName = name.toLowerCase();
       if (lowerName === 'ban lãnh đạo') return 1;
       if (lowerName === 'lãnh đạo') return 2;
       if (lowerName === 'chưa phân bổ') return 99;
       return 3;
     };
     const pA = getPriority(a);
     const pB = getPriority(b);
     if (pA !== pB) return pA - pB;
     return a.localeCompare(b, 'vi');
   });

   const colTotals: Record<string, number> = {};
   const colLists: Record<string, any[]> = {};
   let grandTotalList: any[] = [];

   activeColumnsByGroup.forEach(g => { g.activeRoles.forEach(c => { colTotals[c] = 0; colLists[c] = []; }); });

   rows.forEach(r => {
     activeColumnsByGroup.forEach(g => {
       g.activeRoles.forEach(c => {
         colTotals[c] += (deptMap[r][c] || 0);
         if (deptListMap[r][c]) {
           colLists[c].push(...deptListMap[r][c]);
           grandTotalList.push(...deptListMap[r][c]);
         }
       });
     });
   });

   return { deptMap, deptListMap, groupedColumns: activeColumnsByGroup, rows, colTotals, colLists, grandTotal: uniqueActiveStaff.length, grandTotalList };
 }, [uniqueActiveStaff]);