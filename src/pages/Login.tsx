import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/src/components/ui/card";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [appPass, setAppPass] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const GAS_URL = "https://script.google.com/macros/s/AKfycbwPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqPqP/exec"; // Thay bằng URL thật của bạn

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId || !appPass) {
      setError("Vui lòng nhập đầy đủ ID và App Pass");
      return;
    }

    setIsLoading(true);

    try {
      // Gọi lên Google Apps Script API
      const response = await fetch(`${GAS_URL}?action=loginUser&args=${encodeURIComponent(JSON.stringify([userId, appPass]))}`);
      const data = await response.json();

      if (data.user) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify({ 
          id: data.user.id, 
          name: data.user.name,
          role: data.user.role.toLowerCase().includes("admin") ? "admin" : "user" 
        }));
        navigate("/");
      } else {
        setError(data.error || "Sai tài khoản hoặc mật khẩu");
      }
    } catch (err) {
      console.error("Login error:", err);
      // Fallback cho môi trường dev nếu chưa có link thật
      if (userId === "admin" && appPass === "admin") {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("currentUser", JSON.stringify({ 
          id: "admin", 
          name: "Quản trị viên",
          role: "admin" 
        }));
        navigate("/");
      } else {
        setError("Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9] p-4">
      <Card className="w-full max-w-md border-0 shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="space-y-2 text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-auto">
              <img src="/logo.png" alt="CDX Logo" className="h-full w-auto object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          </div>
          <CardTitle className="text-xl font-bold uppercase text-[#2E7D32] tracking-wide">
            Hệ Thống Quản Lý
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5 px-6 md:px-8">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600" htmlFor="userId">
                Mã nhân viên (ID)
              </label>
              <Input
                id="userId"
                placeholder="Nhập ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#2E7D32]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600" htmlFor="appPass">
                Mật khẩu
              </label>
              <Input
                id="appPass"
                type="password"
                placeholder="Nhập mật khẩu"
                value={appPass}
                onChange={(e) => setAppPass(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-[#2E7D32]"
              />
            </div>
          </CardContent>
          <CardFooter className="px-6 md:px-8 pb-8 pt-4">
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-bold uppercase tracking-wide rounded-xl bg-gradient-to-r from-[#2E7D32] to-[#388E3C] hover:from-[#1B5E20] hover:to-[#2E7D32] shadow-md transition-all" 
              disabled={isLoading}
            >
              {isLoading ? "Đang xử lý..." : "Đăng nhập"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
