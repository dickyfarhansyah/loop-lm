import { Link } from "react-router-dom"
import { Home, ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-muted-foreground/20">404</h1>
          <h2 className="text-2xl font-semibold">Halaman Tidak Ditemukan</h2>
          <p className="text-muted-foreground">
            Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="size-4 mr-2" />
            Kembali
          </Button>
          <Link to="/">
            <Button>
              <Home className="size-4 mr-2" />
              Ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export { NotFoundPage }
