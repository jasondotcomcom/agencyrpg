import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
console.log('Supabase Key starts with:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10))

export const supabase = createClient(supabaseUrl, supabaseKey)
