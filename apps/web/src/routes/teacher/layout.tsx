import { Navigate, Outlet } from "react-router"
import { useAuth, useUser } from "@clerk/react-router"
import { getUserRole } from "@/lib/user-role"

export function TeacherLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const { user } = useUser()

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/login" replace />
  if (getUserRole(user) !== "teacher") return <Navigate to="/" replace />

  return <Outlet />
}
