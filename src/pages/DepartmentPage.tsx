{/* BẢNG CẢNH BÁO HỢP ĐỒNG SẮP HẾT HẠN (CHỈ HIỆN Ở CÔNG TY MẸ) */}
                  {isParentUnit && (
                    <div className="mb-6 p-5 bg-orange-50/30 rounded-2xl border border-orange-100 shadow-sm animate-in fade-in">
                      <h4 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><AlertTriangle size={18} /> Theo dõi Hợp đồng Dịch vụ Bảo vệ Toàn Cụm</h4>
                      {expiringContracts.length === 0 ? (
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-center flex flex-col items-center shadow-sm">
                          <CheckCircle2 size={32} className="text-emerald-500 mb-2"/>
                          <p className="text-emerald-700 font-bold text-sm">Tuyệt vời! Tất cả các hợp đồng bảo vệ toàn cụm đều đang trong thời hạn an toàn (&gt; 30 ngày).</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto bg-white rounded-xl border border-orange-200 shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-orange-50 border-b border-orange-100 text-xs font-bold text-orange-800 uppercase tracking-wider">
                                <th className="p-3">Đơn vị / Showroom</th>
                                <th className="p-3">Nhà cung cấp BV</th>
                                <th className="p-3 text-center">Ngày hết hạn</th>
                                <th className="p-3 text-right">Tình trạng cảnh báo</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-50">
                              {expiringContracts.map((contract, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                                  <td className="p-3 font-bold text-gray-800 text-sm">{contract.unitName}</td>
                                  <td className="p-3 font-semibold text-gray-600 text-sm uppercase">{contract.provider}</td>
                                  <td className="p-3 text-center font-bold text-gray-800 text-sm">{contract.endDate}</td>
                                  <td className="p-3 text-right">
                                    {contract.diffDays < 0 ? (
                                      <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-black border border-red-200 animate-pulse shadow-sm">Quá hạn {Math.abs(contract.diffDays)} ngày</span>
                                    ) : contract.diffDays === 0 ? (
                                      <span className="inline-block px-2.5 py-1 bg-red-100 text-red-700 rounded text-xs font-black border border-red-200 animate-pulse shadow-sm">Hết hạn ngay hôm nay!</span>
                                    ) : (
                                      <span className="inline-block px-2.5 py-1 bg-orange-100 text-orange-700 rounded text-xs font-black border border-orange-200 shadow-sm">Chỉ còn {contract.diffDays} ngày</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
