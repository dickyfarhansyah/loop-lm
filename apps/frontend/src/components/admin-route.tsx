import { Navigate, Outlet } from "react-router-dom"
import { useSession } from "@/hooks"

function AdminRoute() {
    const { data: session, isLoading } = useSession()

    
    if (isLoading) {
        return null
    }

    
    const isAdmin = session?.role === "admin"

    
    if (!isAdmin) {
        return <Navigate to="/" replace />
    }

    
    return <Outlet />
}

export { AdminRoute }
