from dotenv import load_dotenv
load_dotenv()
import os
print('SUPABASE_URL:', os.getenv('SUPABASE_URL'))
print('SUPABASE_KEY:', os.getenv('SUPABASE_KEY')[:20] if os.getenv('SUPABASE_KEY') else 'NOT FOUND')