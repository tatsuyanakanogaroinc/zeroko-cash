require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncUsers() {
  try {
    console.log('Fetching users from Supabase Auth...');
    
    // Get all users from auth
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} users in auth`);
    
    // Get existing users from users table
    const { data: existingUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id');
    
    if (usersError) {
      console.error('Error fetching existing users:', usersError);
      return;
    }
    
    const existingUserIds = new Set(existingUsers.map(u => u.id));
    console.log(`Found ${existingUsers.length} users in users table`);
    
    // Find users that need to be inserted
    const usersToInsert = authUsers.users
      .filter(authUser => !existingUserIds.has(authUser.id))
      .map(authUser => ({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Unknown',
        created_at: authUser.created_at,
        updated_at: new Date().toISOString()
      }));
    
    if (usersToInsert.length === 0) {
      console.log('All users are already synced!');
      return;
    }
    
    console.log(`Inserting ${usersToInsert.length} missing users...`);
    
    // Insert missing users
    const { data: insertedUsers, error: insertError } = await supabaseAdmin
      .from('users')
      .insert(usersToInsert)
      .select();
    
    if (insertError) {
      console.error('Error inserting users:', insertError);
      return;
    }
    
    console.log(`Successfully inserted ${insertedUsers.length} users:`);
    insertedUsers.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`);
    });
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

syncUsers();
