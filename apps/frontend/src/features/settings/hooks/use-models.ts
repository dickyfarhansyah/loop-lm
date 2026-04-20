import { useQuery } from "@tanstack/react-query"
import { modelService } from "../services"

const MODELS_KEY = ["models"]

export function useAvailableModels() {
  return useQuery({
    queryKey: [...MODELS_KEY, "available"],
    queryFn: modelService.getAvailableModels,
  })
}
