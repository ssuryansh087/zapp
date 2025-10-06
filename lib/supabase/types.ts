export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  prompt: string;
  stack: 'react-native' | 'flutter';
  virtual_filesystem: Record<string, any>;
  active_file: string | null;
  active_file_preview_code: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  project_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};
