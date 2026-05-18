import { Navigate } from "react-router"
import { useAuth, useUser } from "@clerk/react-router"
import { getRequestedUserRole, getUserRole } from "@/lib/user-role"

export function RootRoute() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
  const { user } = useUser()

  if (!isLoaded) {
    return null
  }

  if (!isSignedIn) {
    return <Navigate to="/auth/login" replace />
  }

  const role = getUserRole(user)
  const requestedRole = getRequestedUserRole(user)
  console.log("Role : " + role)
  if (role === "admin") {
    return <Navigate to="/auth/admin" replace />
  }

  if (role === "teacher") {
    return <Navigate to="/teacher" replace />
  }

  if (role === "student") {
    return <Navigate to="/student" replace />
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Your account is pending role assignment.
      </p>
      {requestedRole && (
        <p className="mt-2 text-xs text-muted-foreground">
          Requested role: <span className="capitalize">{requestedRole}</span>
        </p>
      )}
    </div>
  )
}
