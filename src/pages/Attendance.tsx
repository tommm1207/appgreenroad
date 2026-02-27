import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, CalendarDays, UserPlus } from "lucide-react";
import * as XLSX from "xlsx";

type AttendanceStatus = "" | "X" | "H" | "P" | "V";
// X: Cả ngày (1)
// H: Nửa ngày (0.5)
// P: Có phép (0)
// V: Vắng không phép (0)

interface Employee {
  id: string;
  name: string;
  department: string;
}

export default function Attendance() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, AttendanceStatus>>>({});
  
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpDept, setNewEmpDept] = useState("");

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/attendance");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data.employees || []);
          setAttendance(data.records || {});
        }
      } catch (error) {
        console.error("Failed to fetch attendance data:", error);
      }
    };
    fetchData();
  }, []);

  // Save data
  const saveData = async (emps: Employee[], att: Record<string, Record<string, AttendanceStatus>>) => {
    setEmployees(emps);
    setAttendance(att);
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: emps, records: att }),
      });
    } catch (error) {
      console.error("Failed to save attendance data:", error);
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleAddEmployee = () => {
    if (!newEmpName.trim()) return;
    const newEmp: Employee = {
      id: Math.random().toString(36).substring(2, 9),
      name: newEmpName,
      department: newEmpDept || "Chung",
    };
    const newEmps = [...employees, newEmp];
    saveData(newEmps, attendance);
    setNewEmpName("");
    setNewEmpDept("");
  };

  const handleRemoveEmployee = (id: string) => {
    if (confirm("Xóa nhân viên này khỏi danh sách chấm công?")) {
      const newEmps = employees.filter(e => e.id !== id);
      const newAtt = { ...attendance };
      delete newAtt[id];
      saveData(newEmps, newAtt);
    }
  };

  const toggleAttendance = (empId: string, day: number) => {
    const dateKey = `${year}-${month + 1}-${day}`;
    const currentStatus = attendance[empId]?.[dateKey] || "";
    
    // Cycle: "" -> "X" -> "H" -> "P" -> "V" -> ""
    let nextStatus: AttendanceStatus = "";
    if (currentStatus === "") nextStatus = "X";
    else if (currentStatus === "X") nextStatus = "H";
    else if (currentStatus === "H") nextStatus = "P";
    else if (currentStatus === "P") nextStatus = "V";
    else if (currentStatus === "V") nextStatus = "";

    const newAtt = {
      ...attendance,
      [empId]: {
        ...(attendance[empId] || {}),
        [dateKey]: nextStatus
      }
    };
    saveData(employees, newAtt);
  };

  const calculateTotal = (empId: string) => {
    let total = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const status = attendance[empId]?.[`${year}-${month + 1}-${day}`];
      if (status === "X") total += 1;
      if (status === "H") total += 0.5;
    }
    return total;
  };

  const isWeekend = (day: number) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6; // Sunday or Saturday
  };

  const handleExportExcel = () => {
    if (employees.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const exportData = employees.map(emp => {
      const row: any = {
        "Mã NV": emp.id,
        "Họ và tên": emp.name,
        "Phòng ban": emp.department,
      };
      
      for (let day = 1; day <= daysInMonth; day++) {
        row[`Ngày ${day}`] = attendance[emp.id]?.[`${year}-${month + 1}-${day}`] || "";
      }
      
      row["Tổng công"] = calculateTotal(emp.id);
      return row;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, `ChamCong_T${month + 1}_${year}`);
    XLSX.writeFile(wb, `BangChamCong_Thang${month + 1}_${year}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Chấm công</h2>
          <p className="text-slate-500">Quản lý ngày công nhân viên hàng tháng</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={handleExportExcel}>
            <Download className="h-4 w-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar for adding employees */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Thêm nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Họ và tên</label>
              <Input 
                placeholder="Nhập tên nhân viên..." 
                value={newEmpName}
                onChange={e => setNewEmpName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEmployee()}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phòng ban / Tổ đội</label>
              <Input 
                placeholder="VD: Thi công, Kế toán..." 
                value={newEmpDept}
                onChange={e => setNewEmpDept(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddEmployee()}
              />
            </div>
            <Button className="w-full gap-2" onClick={handleAddEmployee}>
              <Plus className="h-4 w-4" /> Thêm vào danh sách
            </Button>

            <div className="pt-4 border-t mt-4">
              <h4 className="text-sm font-semibold mb-2 text-slate-700">Ghi chú ký hiệu:</h4>
              <ul className="text-sm space-y-1 text-slate-600">
                <li><span className="font-bold text-emerald-600 w-6 inline-block">X</span> : Đi làm cả ngày (1 công)</li>
                <li><span className="font-bold text-blue-600 w-6 inline-block">H</span> : Làm nửa ngày (0.5 công)</li>
                <li><span className="font-bold text-amber-600 w-6 inline-block">P</span> : Nghỉ có phép (0 công)</li>
                <li><span className="font-bold text-red-600 w-6 inline-block">V</span> : Vắng mặt (0 công)</li>
              </ul>
              <p className="text-xs text-slate-400 mt-3 italic">Mẹo: Bấm liên tục vào ô để đổi ký hiệu.</p>
            </div>
          </CardContent>
        </Card>

        {/* Main Attendance Table */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              Bảng chấm công
            </CardTitle>
            <div className="flex items-center gap-4 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-slate-700 min-w-[100px] text-center">
                Tháng {month + 1} / {year}
              </span>
              <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="text-xs text-slate-600 uppercase bg-slate-100 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-left border-r border-slate-200 sticky left-0 bg-slate-100 z-20 min-w-[150px] md:min-w-[180px]">
                      Nhân viên
                    </th>
                    {days.map(day => (
                      <th 
                        key={day} 
                        className={`px-2 py-3 font-medium border-r border-slate-200 min-w-[40px] ${isWeekend(day) ? 'bg-slate-200 text-slate-500' : ''}`}
                      >
                        {day}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-bold border-l border-slate-300 bg-emerald-50 text-emerald-800 sticky right-0 z-20">
                      Tổng
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                        <td className="px-4 py-2 text-left border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-10">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 whitespace-nowrap">{emp.name}</p>
                              <p className="text-xs text-slate-500">{emp.department}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveEmployee(emp.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        {days.map(day => {
                          const status = attendance[emp.id]?.[`${year}-${month + 1}-${day}`] || "";
                          return (
                            <td 
                              key={day} 
                              className={`px-1 py-2 border-r border-slate-100 cursor-pointer select-none transition-colors
                                ${isWeekend(day) ? 'bg-slate-50' : ''}
                                ${status === 'X' ? 'text-emerald-600 font-bold bg-emerald-50/50' : ''}
                                ${status === 'H' ? 'text-blue-600 font-bold bg-blue-50/50' : ''}
                                ${status === 'P' ? 'text-amber-600 font-bold bg-amber-50/50' : ''}
                                ${status === 'V' ? 'text-red-600 font-bold bg-red-50/50' : ''}
                                hover:bg-slate-200
                              `}
                              onClick={() => toggleAttendance(emp.id, day)}
                            >
                              {status}
                            </td>
                          );
                        })}
                        <td className="px-4 py-2 font-bold text-emerald-700 border-l border-slate-300 bg-emerald-50/30 sticky right-0 z-10">
                          {calculateTotal(emp.id)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={daysInMonth + 2} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <UserPlus className="h-6 w-6 text-slate-400" />
                          </div>
                          <p className="font-medium text-slate-900">Chưa có nhân viên nào</p>
                          <p className="text-sm mt-1">Vui lòng thêm nhân viên ở cột bên trái để bắt đầu chấm công.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
