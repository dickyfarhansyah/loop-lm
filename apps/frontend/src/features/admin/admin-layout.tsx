import { Outlet } from "react-router-dom"

import { AdminTabs } from "./components"

function AdminLayout() {
  return (
    <div className="flex h-full flex-col">
      <AdminTabs />
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}

export { AdminLayout }
