import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

E no seu `.env` certifique que as variáveis estão com o prefixo **VITE_** (obrigatório no Vite):
```
VITE_SUPABASE_URL=https://vyzfqszujctwtahzjthf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5emZxc3p1amN0d3RhaHpqdGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzI5MTUsImV4cCI6MjA4NzkwODkxNX0.3LlrEA2RVRTLShQ9eIBNZ4xU6I_M4kMw5CfjgOjrH4o