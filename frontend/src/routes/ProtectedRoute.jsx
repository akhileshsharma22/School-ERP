import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useSelector((state) => state.auth);

  // If there's no token or not authenticated, redirect to login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;