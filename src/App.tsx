import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Login from "./pages/Login";
import DashboardLayout from "./pages/DashboardLayout";
import Home from "./pages/Home";
import Costs from "./pages/Costs";
import Inventory from "./pages/Inventory";
import Partners from "./pages/Partners";
import System from "./pages/System";
import Reports from "./pages/Reports";
import HR from "./pages/HR";
import ModulePage from "./pages/ModulePage";
import Attendance from "./pages/Attendance";

// A simple auth guard component
function RequireAuth({ children }: { children: JSX.Element }) {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  // Migrate data from localStorage to API on first load
  useEffect(() => {
    const migrateData = async () => {
      const migrated = localStorage.getItem("cdx_migrated_to_api");
      if (migrated) return;

      try {
        // Migrate Attendance
        const savedEmps = localStorage.getItem("cdx_attendance_emps");
        const savedAtt = localStorage.getItem("cdx_attendance_data");
        if (savedEmps || savedAtt) {
          await fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employees: savedEmps ? JSON.parse(savedEmps) : [],
              records: savedAtt ? JSON.parse(savedAtt) : {}
            }),
          });
        }

        // Migrate Modules
        const modules = ["quan-ly-nhan-su", "chi-phi", "kho", "doi-tac", "he-thong"];
        for (const mod of modules) {
          const savedHeaders = localStorage.getItem(`cdx_headers_${mod}`);
          const savedData = localStorage.getItem(`cdx_data_${mod}`);
          if (savedHeaders || savedData) {
            await fetch(`/api/modules/${mod}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                headers: savedHeaders ? JSON.parse(savedHeaders) : [],
                data: savedData ? JSON.parse(savedData) : []
              }),
            });
          }
        }

        localStorage.setItem("cdx_migrated_to_api", "true");
        console.log("Data migration complete");
      } catch (error) {
        console.error("Migration failed:", error);
      }
    };

    migrateData();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Home />} />
          <Route path="costs" element={<Costs />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="partners" element={<Partners />} />
          <Route path="system" element={<System />} />
          <Route path="reports" element={<Reports />} />
          <Route path="hr" element={<HR />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="module/:id" element={<ModulePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
