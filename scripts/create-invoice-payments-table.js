const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.localファイルを手動で読み込み
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envLines = envFile.split('\n');
  
  envLines.forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
} catch (error) {
  console.log('.env.localファイルが見つからないか読み込めません');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createInvoicePaymentsTable() {
  console.log('請求書払いテーブルを作成しています...');

  const { data, error } = await supabase.rpc('create_invoice_payments_table');

  if (error) {
    console.error('テーブル作成エラー:', error);
    
    // 手動でSQLを実行
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS invoice_payments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
        project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        event_id UUID REFERENCES events(id) ON DELETE SET NULL,
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        description TEXT NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NOT NULL,
        vendor_name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'paid')),
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- インデックス作成
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_user_id ON invoice_payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_status ON invoice_payments(status);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_date ON invoice_payments(invoice_date);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_due_date ON invoice_payments(due_date);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_category_id ON invoice_payments(category_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_department_id ON invoice_payments(department_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_project_id ON invoice_payments(project_id);
      CREATE INDEX IF NOT EXISTS idx_invoice_payments_event_id ON invoice_payments(event_id);

      -- 更新時間の自動更新トリガー
      CREATE OR REPLACE FUNCTION update_invoice_payments_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_invoice_payments_updated_at ON invoice_payments;
      CREATE TRIGGER trigger_update_invoice_payments_updated_at
        BEFORE UPDATE ON invoice_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_invoice_payments_updated_at();
    `;

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (sqlError) {
      console.error('SQL実行エラー:', sqlError);
      return;
    }
  }

  console.log('請求書払いテーブルの作成が完了しました');
}

async function main() {
  try {
    await createInvoicePaymentsTable();
    console.log('すべての処理が完了しました');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

main();
