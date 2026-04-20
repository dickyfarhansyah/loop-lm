
export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentId?: string | null;
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderResponse {
  id: string;
  name: string;
  parentId?: string | null;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

export interface UpdateFolderRequest {
  name?: string;
  parentId?: string | null;
  isExpanded?: boolean;
}
