import {useAuth, useUser} from "@clerk/react-router";
import {getUserRole} from "@/lib/user-role.ts";
import {NavLink} from "react-router";

export function AppNavbar() {
    const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false })
    const { user } = useUser()

    if (!isLoaded || !isSignedIn) return null
    if (getUserRole(user) !== "admin") return null

    return (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
            <nav
                aria-label="Primary"
                className="flex max-w-7xl items-center gap-1"
            >
                <NavLink
                    to="/auth/admin"
                    end
                    className={({ isActive }) => getNavLinkClassName(isActive)}
                >
                    Dashboard
                </NavLink>
                <NavLink
                    to="/auth/admin/user-management/role-requests"
                    className={({ isActive }) => getNavLinkClassName(isActive)}
                >
                    Role requests
                </NavLink>
            </nav>
        </header>
    )
}

function getNavLinkClassName(isActive: boolean): string {
    const baseClassName =
        "rounded-4xl px-3 py-1.5 text-sm font-medium transition-colors"

    if (isActive) {
        return `${baseClassName} bg-primary text-primary-foreground`
    }

    return `${baseClassName} text-muted-foreground hover:bg-muted hover:text-foreground`
}
