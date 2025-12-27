import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth, UserRole } from "../../contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = "/",
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (
    !isAuthenticated ||
    !user ||
    (allowedRoles && !allowedRoles.includes(user.role))
  ) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check role-based access if allowedRoles is specified
  // if (allowedRoles && !allowedRoles.includes(user.role)) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center bg-white p-8 rounded-lg shadow-md max-w-md">
  //         <div className="text-red-500 text-6xl mb-4">🚫</div>
  //         <h2 className="text-2xl font-bold text-gray-800 mb-2">
  //           Access Denied
  //         </h2>
  //         <p className="text-gray-600 mb-4">
  //           You don't have permission to access this page.
  //         </p>
  //         <p className="text-sm text-gray-500">
  //           Your role: <span className="font-medium">{user.role}</span>
  //         </p>
  //         <button
  //           onClick={() => window.history.back()}
  //           className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  //         >
  //           Go Back
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }

  return <>{children}</>;
};
