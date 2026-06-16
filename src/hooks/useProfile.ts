import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

export async function updateProfile(userId: string, input: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(input)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function getProviderProfile(providerId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', providerId).single()
  return data
}
