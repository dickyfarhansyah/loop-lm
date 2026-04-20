import { Suspense } from "react"
import { createBrowserRouter, type RouteObject } from "react-router-dom"

import { ProtectedRoute } from "@/components/protected-route"
import { GuestRoute } from "@/components/guest-route"
import { AdminRoute } from "@/components/admin-route"
import { SetupGuard } from "@/components/setup-guard"
import { routes, type RouteConfig } from "./config"

function buildRoutes(configs: RouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    const Element = config.element

    const route: RouteObject = {
      path: config.path,
      index: config.index,
      handle: { title: config.title },
      element: (
        <Suspense fallback={null}>
          <Element />
        </Suspense>
      ),
    }

    if (config.children) {
      route.children = buildRoutes(config.children)
    }

    return route
  })
}

const rootRoute = routes.find((r) => r.path === "/")
const authRoute = routes.find((r) => r.path === "/auth")
const shareRoute = routes.find((r) => r.path === "/share/:shareId")
const setupRoute = routes.find((r) => r.path === "/setup")
const notFoundRoute = routes.find((r) => r.path === "*")

function buildRoutesWithAdminProtection(configs: RouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    const Element = config.element

    const route: RouteObject = {
      path: config.path,
      index: config.index,
      handle: { title: config.title },
      element: (
        <Suspense fallback={null}>
          <Element />
        </Suspense>
      ),
    }

    if (config.children) {
      
      if (config.path === "admin") {
        route.children = [
          {
            element: <AdminRoute />,
            children: buildRoutes(config.children),
          },
        ]
      } else {
        route.children = buildRoutesWithAdminProtection(config.children)
      }
    }

    return route
  })
}

export const router = createBrowserRouter([
  
  {
    element: <SetupGuard />,
    children: [
      {
        element: <ProtectedRoute />,
        children: rootRoute ? buildRoutesWithAdminProtection([rootRoute]) : [],
      },
      {
        element: <GuestRoute />,
        children: authRoute ? buildRoutes([authRoute]) : [],
      },
    ],
  },
  
  ...(setupRoute ? buildRoutes([setupRoute]) : []),
  
  ...(shareRoute ? buildRoutes([shareRoute]) : []),
  
  ...(notFoundRoute ? buildRoutes([notFoundRoute]) : []),
])
