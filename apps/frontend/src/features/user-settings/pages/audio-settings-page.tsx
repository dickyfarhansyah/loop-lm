import { UnderDevelopmentAlert } from "@/components/under-development-alert"

function AudioSettingsPage() {
  return (
    <div className="w-ful">
      <h2 className="text-xl font-semibold mb-6">Audio</h2>
      <UnderDevelopmentAlert />

      {/* <p className="text-muted-foreground">Pengaturan audio akan ditampilkan di sini.</p> */}
    </div>
  )
}

export { AudioSettingsPage }
