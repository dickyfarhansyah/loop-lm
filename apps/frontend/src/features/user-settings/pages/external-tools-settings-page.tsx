import { UnderDevelopmentAlert } from "@/components/under-development-alert"


function ExternalToolsSettingsPage() {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-6">External Tools</h2>
      <UnderDevelopmentAlert />
      <p className="text-muted-foreground">Pengaturan external tools akan ditampilkan di sini.</p>
    </div>
  )
}

export { ExternalToolsSettingsPage }
