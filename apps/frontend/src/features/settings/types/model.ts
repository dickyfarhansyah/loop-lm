export interface Model {
  id: string
  object: string
  created: number
  owned_by: string
  connection: string
  isEnabled?: boolean
  isDefault?: boolean
  isPinned?: boolean
}

export interface ModelsResponse {
  object: string
  data: Model[]
}
