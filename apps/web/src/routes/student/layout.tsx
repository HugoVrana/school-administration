import { Navigate, Outlet } from "react-router"
import { useAuth, useUser } from "@clerk/react-router"
import { getUserRole } from "@/lib/user-role"

export function StudentLayout() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const { user } = useUser()

  if (!isLoaded) return null
  if (!isSignedIn) return <Navigate to="/auth/login" replace />
  if (getUserRole(user) !== "student") return <Navigate to="/" replace />

  return <Outlet />
}
