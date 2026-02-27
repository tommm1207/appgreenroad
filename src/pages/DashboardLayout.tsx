import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileBarChart, Users, LogOut, Building2, Wallet, Package, UsersRound, Settings, CalendarCheck, Menu, X, ShieldAlert } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role || "user");
      setUserName(user.name || user.id);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("currentUser");
    navigate("/login");
  };

  const allNavItems = [
    { name: "Tổng quan", path: "/", icon: LayoutDashboard, roles: ["admin", "user"] },
    { name: "Quản lý Kho", path: "/inventory", icon: Package, roles: ["admin", "user"] },
    { name: "Chấm công", path: "/attendance", icon: CalendarCheck, roles: ["admin", "user"] },
    { name: "Báo cáo", path: "/reports", icon: FileBarChart, roles: ["admin", "user"] },
    { name: "Chi phí", path: "/costs", icon: Wallet, roles: ["admin"] },
    { name: "Đối tác", path: "/partners", icon: UsersRound, roles: ["admin"] },
    { name: "Nhân sự", path: "/hr", icon: Users, roles: ["admin"] },
    { name: "Hệ thống", path: "/system", icon: Settings, roles: ["admin"] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(userRole));

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200">
            <img src="/logo.jpg" alt="CDX Logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <h1 className="font-bold text-slate-900 leading-tight">CDX</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0 shadow-sm border border-slate-200">
              <img src="/logo.jpg" alt="CDX Logo" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 leading-tight">CDX</h1>
              <p className="text-xs text-slate-500">Quản lý thi công</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="px-4 pt-4 pb-2">
          <div className="bg-slate-100 rounded-lg p-3 flex items-center gap-3">
            <div className="h-8 w-8 bg-emerald-200 rounded-full flex items-center justify-center text-emerald-800 font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                {userRole === 'admin' ? <ShieldAlert className="h-3 w-3 text-amber-500" /> : null}
                {userRole === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-[calc(100vh-65px)] md:h-screen">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
