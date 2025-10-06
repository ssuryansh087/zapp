import { supabase } from './client';
import { Project } from './types';

export async function getUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProject(
  userId: string,
  projectData: {
    name: string;
    prompt: string;
    stack: 'react-native' | 'flutter';
    virtual_filesystem: Record<string, any>;
    active_file: string | null;
    active_file_preview_code: string | null;
  }
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      ...projectData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProject(
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', projectId);

  if (error) throw error;
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) throw error;
}

export async function getProject(projectId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
