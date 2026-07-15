export interface HeaderOrParam {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
}

export interface RequestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  url: string;
  headers: HeaderOrParam[];
  queryParams: HeaderOrParam[];
  body: string;
  bodyType: 'json' | 'raw' | 'none';
}

export interface FolderItem {
  id: string;
  name: string;
  items: SidebarItem[];
}

export type SidebarItem =
  | { type: 'request'; request: RequestItem }
  | { type: 'folder'; folder: FolderItem };

export interface CollectionItem {
  id: string;
  name: string;
  items: SidebarItem[];
}

export interface HistoryItem {
  id: string;
  method: string;
  url: string;
  status: number;
  time: number;
  timestamp: string;
}

export interface ResponseState {
  loading: boolean;
  status: number | null;
  statusText: string | null;
  time: number | null;
  size: string | null;
  headers: Array<{ key: string; value: string }>;
  body: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  sync_enabled: boolean;
  created_at: string;
}
