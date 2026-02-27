import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [appPass, setAppPass] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Initialize default admin if no users exist
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const res = await fetch("/api/modules/quan-ly-nhan-su");
        if (res.ok) {
          const data = await res.json();
          if (!data.data || data.data.length === 0) {
            const defaultAdmin = [
              {
                _id: "default-admin-id",
                ID: "admin",
                app_pass: "admin",
                "Phân quyền": "admin",
                "Tên": "Quản trị viên"
              }
            ];
            const defaultHeaders = ["ID", "Tên", "app_pass", "Phân quyền"];
            
            await fetch("/api/modules/quan-ly-nhan-su", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ headers: defaultHeaders, data: defaultAdmin }),
            });
          }
        }
      } catch (error) {
        console.error("Failed to initialize admin:", error);
      }
    };
    initializeAdmin();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId || !appPass) {
      setError("Vui lòng nhập đầy đủ ID và App Pass");
      return;
    }

    let users = [];
    try {
      const res = await fetch("/api/modules/quan-ly-nhan-su");
      if (res.ok) {
        const data = await res.json();
        users = data.data || [];
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }

    // Find user by ID (case-insensitive key match just in case)
    const user = users.find((u: any) => {
      const keys = Object.keys(u);
      
      const idKey = keys.find(k => {
        const lower = k.toLowerCase().trim();
        return lower === "id" || lower === "mã nv" || lower === "mã nhân viên" || lower === "manv";
      });
      
      const passKey = keys.find(k => {
        const lower = k.toLowerCase().trim();
        return lower === "app_pass" || lower === "app pass" || lower === "password" || lower === "mật khẩu" || lower === "mat khau" || lower === "pass";
      });

      if (!idKey || !passKey) return false;
      
      return String(u[idKey]).trim() === userId.trim() && String(u[passKey]).trim() === appPass.trim();
    });

    if (user) {
      const keys = Object.keys(user);
      const roleKey = keys.find(k => {
        const lower = k.toLowerCase().trim();
        return lower === "phân quyền" || lower === "phan quyen" || lower === "role" || lower === "quyền" || lower === "quyen";
      });
      const nameKey = keys.find(k => {
        const lower = k.toLowerCase().trim();
        return lower === "tên" || lower === "name" || lower === "họ và tên" || lower === "ho ten" || lower === "họ tên";
      });

      const role = roleKey ? String(user[roleKey]).toLowerCase() : "user";
      const userName = nameKey ? String(user[nameKey]) : userId;
      
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify({ 
        id: userId, 
        name: userName,
        role: role.includes("admin") ? "admin" : "user" 
      }));
      
      navigate("/");
    } else if (userId === "admin" && appPass === "admin") {
      // Fallback master admin in case local storage has data but no admin account
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("currentUser", JSON.stringify({ 
        id: "admin", 
        name: "Quản trị viên",
        role: "admin" 
      }));
      
      navigate("/");
    } else {
      setError("ID hoặc App Pass không chính xác!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-md border border-slate-200">
              <img src="/logo.svg" alt="CDX Logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Quản lý thi công CDX</CardTitle>
          <CardDescription>
            Công ty Cổ phần Xuất Nhập Khẩu Con Đường Xanh
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="userId">
                ID Nhân viên
              </label>
              <Input
                id="userId"
                placeholder="Nhập ID (VD: admin)"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor="appPass">
                App Pass
              </label>
              <Input
                id="appPass"
                type="password"
                placeholder="Nhập App Pass"
                value={appPass}
                onChange={(e) => setAppPass(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Đăng nhập
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
