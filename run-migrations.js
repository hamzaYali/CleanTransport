const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client with service_role key for admin operations
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    // Read migrations from the src/lib/migrations directory
    const migrationsDir = path.join(__dirname, 'src', 'lib', 'migrations');
    
    // Get all SQL files sorted by filename
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Execute each migration file
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Split the SQL into separate statements
      const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        if (statement) {
          console.log(`Executing statement ${i + 1}/${statements.length} from ${file}`);
          
          try {
            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
            
            if (error) {
              console.error(`Error executing statement: ${error.message}`);
            }
          } catch (err) {
            console.error(`Exception executing statement: ${err.message}`);
          }
        }
      }
      
      console.log(`Completed migration: ${file}`);
    }
    
    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
}

runMigrations(); 