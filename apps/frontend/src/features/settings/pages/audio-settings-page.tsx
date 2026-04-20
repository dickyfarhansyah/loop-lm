import * as React from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAudioSettings, useUpdateAudioSettings } from "../hooks/use-settings"
import type { AudioSettings } from "../types/settings"

function AudioSettingsPage() {
    const { t } = useTranslation()
    const { data: audioSettings, isLoading } = useAudioSettings()
    const updateAudio = useUpdateAudioSettings()

    const [local, setLocal] = React.useState<Partial<AudioSettings>>({})

    React.useEffect(() => {
        if (audioSettings) {
            setLocal(audioSettings)
        }
    }, [audioSettings])

    const set = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
        setLocal((prev) => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            await updateAudio.mutateAsync(local)
            toast.success(t("settingsPage.audioSavedSuccess"))
        } catch {
            toast.error(t("settingsPage.audioSaveFailed"))
        }
    }

    if (isLoading) return null

    return (
        <div className="space-y-8 w-full">
            {/* Speech-to-Text */}
            <section className="space-y-5">
                <h2 className="text-lg font-semibold">{t("settingsPage.audioSttTitle")}</h2>

                {/* Supported MIME Types */}
                <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.audioSttSupportedMime")}</Label>
                    <Input
                        placeholder="e.g., audio/wav,audio/mpeg,video/* (leave blank for defaults)"
                        value={local.supported_mime_types ?? ""}
                        onChange={(e) => set("supported_mime_types", e.target.value)}
                    />
                </div>

                <Separator />

                {/* STT Engine */}
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.audioSttEngine")}</Label>
                    <Select
                        value={local.stt_engine ?? "bisikan"}
                        onValueChange={(v) => set("stt_engine", v)}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder={t("settingsPage.audioSttEnginePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bisikan">{t("settingsPage.audioEngineWhisper")}</SelectItem>
                            <SelectItem value="openai">{t("settingsPage.audioEngineOpenAI")}</SelectItem>
                            <SelectItem value="webapi">{t("settingsPage.audioEngineWebAPI")}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* STT Model */}
                <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.audioSttModel")}</Label>
                    <div className="flex gap-2">
                        <Input
                            value={local.stt_model ?? "base"}
                            onChange={(e) => set("stt_model", e.target.value)}
                            className="flex-1"
                        />
                        <Button variant="ghost" size="icon" title={t("settingsPage.audioSttDownload")}>
                            <Download className="size-4" />
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {t("settingsPage.audioSttModelNote")}
                    </p>
                </div>
            </section>

            <Separator />

            {/* Text-to-Speech */}
            <section className="space-y-5">
                <h2 className="text-lg font-semibold">{t("settingsPage.audioTtsTitle")}</h2>

                {/* TTS Engine */}
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.audioTtsEngine")}</Label>
                    <Select
                        value={local.tts_engine ?? "webapi"}
                        onValueChange={(v) => set("tts_engine", v)}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder={t("settingsPage.audioTtsEnginePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="webapi">{t("settingsPage.audioTtsEngineWebAPI")}</SelectItem>
                            <SelectItem value="openai">{t("settingsPage.audioTtsEngineOpenAI")}</SelectItem>
                            <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* TTS Voice */}
                <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground">{t("settingsPage.audioTtsVoice")}</Label>
                    <Select
                        value={local.tts_voice ?? ""}
                        onValueChange={(v) => set("tts_voice", v)}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder={t("settingsPage.audioTtsVoicePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="alloy">Alloy</SelectItem>
                            <SelectItem value="echo">Echo</SelectItem>
                            <SelectItem value="fable">Fable</SelectItem>
                            <SelectItem value="onyx">Onyx</SelectItem>
                            <SelectItem value="nova">Nova</SelectItem>
                            <SelectItem value="shimmer">Shimmer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* Response Splitting */}
                <div className="flex items-center justify-between">
                    <Label>{t("settingsPage.audioResponseSplitting")}</Label>
                    <Select
                        value={local.response_splitting ?? "punctuation"}
                        onValueChange={(v) => set("response_splitting", v as AudioSettings["response_splitting"])}
                    >
                        <SelectTrigger className="w-52">
                            <SelectValue placeholder={t("settingsPage.audioResponseSplittingPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="punctuation">Punctuation</SelectItem>
                            <SelectItem value="paragraph">Paragraphs</SelectItem>
                            <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                    {t("settingsPage.audioResponseSplittingNote")}
                </p>
            </section>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={updateAudio.isPending}>
                    {updateAudio.isPending ? t("settingsPage.savingBtn") : t("settingsPage.saveBtn")}
                </Button>
            </div>
        </div>
    )
}

export { AudioSettingsPage }
