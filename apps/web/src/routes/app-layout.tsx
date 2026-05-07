import { ClerkProvider } from "@clerk/react-router"
import { Outlet } from "react-router"
import { GlobalLogoutButton } from "@workspace/auth-ui"

export function AppLayout() {
  return (
    <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
      <Outlet />
      <GlobalLogoutButton redirectUrl="/auth/login" />
    </ClerkProvider>
  )
}
