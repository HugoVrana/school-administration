import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/react-router"
import { Button } from "@workspace/ui/components/base/button"

type UserRole = "admin" | "teacher" | "student"

type RoleRequestUser = {
  clerkId: string | null
  createdAt: string
  email: string
  id: number
  name: string | null
  requestedRole: UserRole
  role: UserRole | null
  updatedAt: string
}

type RoleRequestsResponse = {
  roleRequests: RoleRequestUser[]
}

export type RoleRequestPageProps = {
  apiBaseUrl?: string
}

export function RoleRequestPage({ apiBaseUrl = "" }: RoleRequestPageProps) {
  const { getToken, isLoaded, isSignedIn } = useAuth({
    treatPendingAsSignedOut: false,
  })
  const endpoint = useMemo(
    () => buildApiUrl(apiBaseUrl, "/api/admin/role-requests"),
    [apiBaseUrl]
  )

  const [roleRequests, setRoleRequests] = useState<RoleRequestUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadRoleRequests = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true)
      setError(null)

      try {
        const token = await getToken()

        if (!token) throw new Error("Missing session token")

        const response = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        })

        const data = await readRoleRequestsResponse(response)
        setRoleRequests(data.roleRequests)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return

        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [endpoint, getToken]
  )

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const controller = new AbortController()

    void loadRoleRequests(controller.signal)

    return () => controller.abort()
  }, [isLoaded, isSignedIn, loadRoleRequests])

  if (!isLoaded) return null

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              Role requests
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Users waiting for an assigned application role.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadRoleRequests()}
            disabled={loading}
          >
            {loading ? "Refreshing" : "Refresh"}
          </Button>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-full divide-y divide-border text-sm">
            <thead className="bg-muted/50 text-left text-xs font-medium uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Current role</th>
                <th className="px-4 py-3">Requested role</th>
                <th className="px-4 py-3">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {roleRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {request.name ?? request.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {request.email}
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {request.role ?? "None"}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {request.requestedRole}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(request.createdAt)}
                  </td>
                </tr>
              ))}
              {!loading && roleRequests.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={4}
                  >
                    No role requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

function buildApiUrl(apiBaseUrl: string, path: string): string {
  const baseUrl = apiBaseUrl.trim().replace(/\/+$/, "")

  return `${baseUrl}${path}`
}

async function readRoleRequestsResponse(
  response: Response
): Promise<RoleRequestsResponse> {
  const contentType = response.headers.get("content-type") ?? ""

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON from ${response.url}, but received ${contentType || "unknown content type"}`
    )
  }

  const body = (await response.json()) as Partial<RoleRequestsResponse> & {
    error?: string
  }

  if (!response.ok) {
    throw new Error(body.error ?? `Request failed with status ${response.status}`)
  }

  if (!Array.isArray(body.roleRequests)) {
    throw new Error("Role request response is missing roleRequests")
  }

  return {
    roleRequests: body.roleRequests,
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  return "Unable to load role requests"
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
