import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "../pages/auth/LoginPage";
import DashboardHome from "../pages/dashboard/DashboardHome";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={<DashboardHome />}
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;