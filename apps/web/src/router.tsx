import { createBrowserRouter } from "react-router"
import { AppLayout } from "./routes/app-layout"
import { RootRoute } from "./routes/root"
import { AdminLayout } from "./routes/admin/layout"
import { AdminDashboard } from "@/routes/admin"
import { TeacherLayout } from "./routes/teacher/layout"
import { TeacherDashboard } from "@/routes/teacher"
import { StudentLayout } from "./routes/student/layout"
import { StudentDashboard } from "@/routes/student"
import { LoginPage, RegisterPage } from "@workspace/auth-ui"
import { RoleRequestPage } from "@/routes/admin/user-management/role-requests"

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <RootRoute />,
      },
      {
        path: "/auth",
        children: [
          {
            path: "login",
            element: <LoginPage registerPath="/auth/register" />,
          },
          {
            path: "register",
            element: <RegisterPage loginPath="/auth/login" />,
          },
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboard />,
              },
              {
                path: "user-management/role-requests",
                element: <RoleRequestPage />,
              },
            ],
          },
        ],
      },
      {
        path: "/teacher",
        element: <TeacherLayout />,
        children: [{ index: true, element: <TeacherDashboard /> }],
      },
      {
        path: "/student",
        element: <StudentLayout />,
        children: [{ index: true, element: <StudentDashboard /> }],
      },
    ],
  },
])
