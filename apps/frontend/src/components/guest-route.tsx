import { Navigate, Outlet } from "react-router-dom"

function GuestRoute() {
  const token = localStorage.getItem("token")

  if (token) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export { GuestRoute }
