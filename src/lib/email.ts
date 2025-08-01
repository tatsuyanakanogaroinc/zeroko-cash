import nodemailer from 'nodemailer';

// メール設定の型定義
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// 環境変数からメール設定を取得
const getEmailConfig = (): EmailConfig => {
  return {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  };
};

// Nodemailerトランスポーターを作成
const createTransporter = () => {
  const config = getEmailConfig();
  
  // 開発環境では実際のメール送信をスキップ
  if (process.env.NODE_ENV === 'development' && !config.auth.user) {
    console.warn('開発環境でメール設定が不完全です。メール送信をスキップします。');
    return null;
  }
  
  return nodemailer.createTransporter(config);
};

// アカウント作成時のメール送信
export const sendAccountCreationEmail = async (
  email: string,
  name: string,
  initialPassword: string,
  loginUrl: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`[開発環境] アカウント作成メール:
To: ${email}
Subject: アカウントが作成されました
Name: ${name}
Password: ${initialPassword}
Login URL: ${loginUrl}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@yourcompany.com',
      to: email,
      subject: 'アカウントが作成されました - ゼロコキャッシュ経費精算システム',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>アカウントが作成されました</h2>
          <p>こんにちは、${name}さん</p>
          <p>ゼロコキャッシュ経費精算システムのアカウントが作成されました。</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>ログイン情報</h3>
            <p><strong>メールアドレス:</strong> ${email}</p>
            <p><strong>初期パスワード:</strong> <code style="background-color: #e0e0e0; padding: 2px 4px; border-radius: 3px;">${initialPassword}</code></p>
          </div>
          
          <p>
            <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              ログインする
            </a>
          </p>
          
          <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #ffc107;">
            <p><strong>重要:</strong> 初回ログイン時に新しいパスワードの設定を求められます。セキュリティのため、必ずパスワードを変更してください。</p>
          </div>
          
          <p>ご質問がございましたら、システム管理者にお問い合わせください。</p>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            このメールは自動送信されています。返信しないでください。
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`アカウント作成メールを送信しました: ${email}`);
    return true;
  } catch (error) {
    console.error('メール送信エラー:', error);
    return false;
  }
};

// パスワードリセット時のメール送信
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log(`[開発環境] パスワードリセットメール:
To: ${email}
Subject: パスワードリセット
Name: ${name}
Reset URL: ${resetUrl}`);
      return true;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'no-reply@yourcompany.com',
      to: email,
      subject: 'パスワードリセットのお知らせ - ゼロコキャッシュ経費精算システム',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>パスワードリセット</h2>
          <p>こんにちは、${name}さん</p>
          <p>パスワードリセットのリクエストを受け付けました。</p>
          
          <p>
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              パスワードをリセットする
            </a>
          </p>
          
          <p>このリンクは24時間で無効になります。</p>
          
          <div style="background-color: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #dc3545;">
            <p><strong>注意:</strong> このリクエストに心当たりがない場合は、このメールを無視してください。</p>
          </div>
          
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">
            このメールは自動送信されています。返信しないでください。
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`パスワードリセットメールを送信しました: ${email}`);
    return true;
  } catch (error) {
    console.error('メール送信エラー:', error);
    return false;
  }
};
