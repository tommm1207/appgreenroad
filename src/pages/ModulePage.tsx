import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { ArrowLeft, Plus, Search, Download, FileUp, X, Trash2, Edit, CheckSquare, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";

// Helper to generate a unique ID for each row
const generateId = () => Math.random().toString(36).substring(2, 15);

export default function ModulePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [headers, setHeaders] = useState<string[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  
  // Search and Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<string | null>(null);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Format ID to readable title
  const title = id
    ? id.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Module";

  // Load data from localStorage when component mounts or ID changes
  useEffect(() => {
    const savedData = localStorage.getItem(`cdx_data_${id}`);
    const savedHeaders = localStorage.getItem(`cdx_headers_${id}`);
    
    if (savedData && savedHeaders) {
      let parsedData = JSON.parse(savedData);
      // Ensure all rows have a unique _id for selection and editing
      parsedData = parsedData.map((row: any) => row._id ? row : { ...row, _id: generateId() });
      setTableData(parsedData);
      setHeaders(JSON.parse(savedHeaders));
    } else {
      setTableData([]);
      setHeaders([]);
    }
    setSelectedIds(new Set());
    setSearchQuery("");
  }, [id]);

  // Helper to save data to both state and localStorage
  const saveDataAndHeaders = (newHeaders: string[], newData: any[]) => {
    const cleanHeaders = newHeaders.filter(h => h !== '_id'); // Prevent _id from showing as a column
    setHeaders(cleanHeaders);
    setTableData(newData);
    localStorage.setItem(`cdx_headers_${id}`, JSON.stringify(cleanHeaders));
    localStorage.setItem(`cdx_data_${id}`, JSON.stringify(newData));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      if (data.length > 0) {
        // Add unique IDs to new data
        const newDataWithIds = data.map((row: any) => ({ ...row, _id: generateId() }));
        
        // Extract all unique keys from the new data
        const newKeys = new Set<string>();
        data.forEach(row => Object.keys(row as object).forEach(k => newKeys.add(k)));
        
        // Merge headers (keep existing, add new ones)
        const mergedHeaders = Array.from(new Set([...headers, ...Array.from(newKeys)]));
        
        // Append data to existing data
        const mergedData = [...tableData, ...newDataWithIds];
        saveDataAndHeaders(mergedHeaders, mergedData);
      }
    };
    reader.readAsBinaryString(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    
    // Remove _id before exporting
    const exportData = tableData.map(row => {
      const newRow = { ...row };
      delete newRow._id;
      return newRow;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, title);
    XLSX.writeFile(wb, `${title}_Export.xlsx`);
  };

  const handleAddNew = () => {
    if (headers.length === 0) {
      const defaultHeaders = ["ID", "Tên", "Mô tả", "Ngày tạo", "Trạng thái"];
      setHeaders(defaultHeaders);
      localStorage.setItem(`cdx_headers_${id}`, JSON.stringify(defaultHeaders));
    }
    setFormData({});
    setEditId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setFormData({ ...row });
    setEditId(row._id);
    setIsModalOpen(true);
  };

  const handleSaveData = () => {
    let newData;
    if (editId) {
      // Update existing row
      newData = tableData.map(row => row._id === editId ? { ...formData, _id: editId } : row);
    } else {
      // Add new row
      newData = [...tableData, { ...formData, _id: generateId() }];
    }
    
    const currentHeaders = headers.length > 0 ? headers : Object.keys(formData).filter(k => k !== '_id');
    saveDataAndHeaders(currentHeaders, newData);
    setIsModalOpen(false);
  };

  const confirmDelete = (action: () => void, title: string, message: string) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        action();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteRow = (rowId: string) => {
    confirmDelete(
      () => {
        const newData = tableData.filter(row => row._id !== rowId);
        saveDataAndHeaders(headers, newData);
        
        const newSelected = new Set(selectedIds);
        newSelected.delete(rowId);
        setSelectedIds(newSelected);
      },
      "Xóa bản ghi",
      "Bạn có chắc chắn muốn xóa bản ghi này? Hành động này không thể hoàn tác."
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    confirmDelete(
      () => {
        const newData = tableData.filter(row => !selectedIds.has(row._id));
        saveDataAndHeaders(headers, newData);
        setSelectedIds(new Set());
      },
      "Xóa nhiều bản ghi",
      `Bạn có chắc chắn muốn xóa ${selectedIds.size} bản ghi đã chọn? Hành động này không thể hoàn tác.`
    );
  };

  const handleClearData = () => {
    confirmDelete(
      () => {
        saveDataAndHeaders([], []);
        setSelectedIds(new Set());
      },
      "Xóa toàn bộ dữ liệu",
      "Bạn có chắc chắn muốn xóa TOÀN BỘ dữ liệu của mục này? Hành động này không thể hoàn tác."
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredData.length && filteredData.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(row => row._id)));
    }
  };

  const toggleSelectRow = (rowId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(rowId)) {
      newSelected.delete(rowId);
    } else {
      newSelected.add(rowId);
    }
    setSelectedIds(newSelected);
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData;
    
    const query = searchQuery.toLowerCase();
    return tableData.filter(row => {
      return headers.some(header => {
        const val = row[header];
        return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
      });
    });
  }, [tableData, headers, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
            <p className="text-slate-500">Quản lý dữ liệu {title.toLowerCase()}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <Button variant="outline" className="gap-2" onClick={handleImportClick}>
            <FileUp className="h-4 w-4" />
            Nhập Excel/CSV
          </Button>
          
          <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
          <Button className="gap-2" onClick={handleAddNew}>
            <Plus className="h-4 w-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-96 h-10">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Tìm kiếm trong mọi cột..." 
                className="pl-9 h-full w-full" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIds.size > 0 && (
                <Button variant="destructive" className="gap-2" onClick={handleDeleteSelected}>
                  <CheckSquare className="h-4 w-4" />
                  Xóa {selectedIds.size} mục đã chọn
                </Button>
              )}
              {tableData.length > 0 && selectedIds.size === 0 && (
                <Button variant="destructive" className="gap-2" onClick={handleClearData}>
                  <Trash2 className="h-4 w-4" />
                  Xóa hết
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium w-12">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {headers.length > 0 ? (
                    <>
                      {headers.map((header, idx) => (
                        <th key={idx} className="px-6 py-4 font-medium whitespace-nowrap">
                          {header}
                        </th>
                      ))}
                      <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4 font-medium">ID</th>
                      <th className="px-6 py-4 font-medium">Tên / Mô tả</th>
                      <th className="px-6 py-4 font-medium">Ngày tạo</th>
                      <th className="px-6 py-4 font-medium">Trạng thái</th>
                      <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, rowIndex) => (
                    <tr key={row._id} className={`border-b border-slate-100 hover:bg-slate-50 ${selectedIds.has(row._id) ? 'bg-emerald-50/50' : ''}`}>
                      <td className="px-6 py-4 w-12">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          checked={selectedIds.has(row._id)}
                          onChange={() => toggleSelectRow(row._id)}
                        />
                      </td>
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {row[header] !== undefined && row[header] !== null ? String(row[header]) : ""}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 w-8" onClick={() => handleEdit(row)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteRow(row._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={headers.length > 0 ? headers.length + 2 : 6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                          <Search className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="font-medium text-slate-900">
                          {searchQuery ? "Không tìm thấy kết quả nào" : "Chưa có dữ liệu"}
                        </p>
                        <p className="text-sm mt-1">
                          {searchQuery ? "Thử tìm kiếm với từ khóa khác." : "Bấm 'Nhập Excel/CSV' để tải dữ liệu lên hoặc 'Thêm mới' để tạo bản ghi."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
              <CardTitle>{editId ? "Chỉnh sửa bản ghi" : "Thêm mới bản ghi"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="-mr-2">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-6 max-h-[60vh] overflow-y-auto">
              {headers.map(header => (
                <div key={header} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{header}</label>
                  <Input 
                    placeholder={`Nhập ${header.toLowerCase()}...`}
                    value={formData[header] || ""} 
                    onChange={e => setFormData({...formData, [header]: e.target.value})}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-4">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
              <Button onClick={handleSaveData}>Lưu dữ liệu</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Custom Confirm Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-sm shadow-lg border-red-100">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <CardTitle className="text-lg">{confirmDialog.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm">{confirmDialog.message}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
                Hủy bỏ
              </Button>
              <Button variant="destructive" onClick={confirmDialog.onConfirm}>
                Xác nhận xóa
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
