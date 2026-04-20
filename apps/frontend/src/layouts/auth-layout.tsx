import { Outlet } from "react-router-dom"

import { useDocumentTitle, useDynamicFavicon } from "@/hooks"

function AuthLayout() {
  useDocumentTitle()
  useDynamicFavicon()

  return <Outlet />
}

export { AuthLayout }
