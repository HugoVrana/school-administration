import { Navigate, Outlet } from "react-router"
import { useAuth, useUser } from "@clerk/react-router"
import { getUserRole } from "@/lib/user-role"

export function AdminLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const { user } = useUser()

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/login" replace />
  if (getUserRole(user) !== "admin") return <Navigate to="/" replace />

  return <Outlet />
}
