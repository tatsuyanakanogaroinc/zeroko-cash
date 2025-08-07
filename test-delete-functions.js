#!/usr/bin/env node

require('dotenv').config();

// 削除機能のテスト用スクリプト
console.log('🧪 削除機能テスト実行中...\n');

const testDeleteEndpoint = async () => {
  const BASE_URL = 'http://localhost:3001';
  
  // 1. 申請データの取得テスト
  console.log('📋 申請データ取得テスト:');
  try {
    const response = await fetch(`${BASE_URL}/api/applications`);
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ データ取得成功: ${data.data?.length || 0}件の申請`);
      
      if (data.data && data.data.length > 0) {
        const sampleApp = data.data[0];
        console.log(`  📝 サンプル申請: ID=${sampleApp.id}, タイプ=${sampleApp.type}, ステータス=${sampleApp.status}, ユーザー=${sampleApp.user_id}`);
      }
    } else {
      console.log('  ❌ データ取得失敗:', response.status);
    }
  } catch (error) {
    console.log('  ❌ データ取得エラー:', error.message);
  }
  
  console.log('');
  
  // 2. 外注データの取得テスト
  console.log('🏗️  外注データ取得テスト:');
  try {
    const response = await fetch(`${BASE_URL}/api/subcontracts`);
    if (response.ok) {
      const data = await response.json();
      console.log(`  ✅ データ取得成功: ${data.length || 0}件の外注契約`);
      
      if (data && data.length > 0) {
        const sampleContract = data[0];
        console.log(`  📝 サンプル契約: ID=${sampleContract.id}, タイトル=${sampleContract.contract_title}, ステータス=${sampleContract.status}`);
      }
    } else {
      console.log('  ❌ データ取得失敗:', response.status);
    }
  } catch (error) {
    console.log('  ❌ データ取得エラー:', error.message);
  }
  
  console.log('');
  
  // 3. 削除API構造テスト
  console.log('🔍 削除APIエンドポイント構造テスト:');
  
  // 申請削除APIテスト（無効なIDで権限エラーをテスト）
  try {
    const testId = 'test-id-12345';
    const testUserId = 'test-user-12345';
    const response = await fetch(`${BASE_URL}/api/applications/${testId}?type=expense&userId=${testUserId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 404) {
      console.log('  ✅ 申請削除API: 正常にエンドポイントが存在（データなしで404）');
    } else if (response.status === 400) {
      console.log('  ✅ 申請削除API: 正常にエンドポイントが存在（パラメーターエラーで400）');
    } else {
      console.log(`  📋 申請削除API: レスポンス ${response.status}`);
    }
  } catch (error) {
    console.log('  ❌ 申請削除API接続エラー:', error.message);
  }
  
  // 外注削除APIテスト
  try {
    const testId = 'test-id-12345';
    const response = await fetch(`${BASE_URL}/api/subcontracts?id=${testId}`, {
      method: 'DELETE'
    });
    
    if (response.status === 500 && response.headers.get('content-type')?.includes('application/json')) {
      const errorData = await response.json();
      if (errorData.error) {
        console.log('  ✅ 外注削除API: 正常にエンドポイントが存在（データエラーで500）');
      }
    } else {
      console.log(`  📋 外注削除API: レスポンス ${response.status}`);
    }
  } catch (error) {
    console.log('  ❌ 外注削除API接続エラー:', error.message);
  }
};

const testAuthMock = () => {
  console.log('👤 認証・権限テスト:');
  
  // 削除権限テスト用の疑似データ
  const mockApplications = [
    {
      id: '1',
      user_id: 'user-123',
      status: 'pending',
      type: 'expense',
      description: 'テスト申請1'
    },
    {
      id: '2', 
      user_id: 'user-456',
      status: 'approved',
      type: 'invoice',
      description: 'テスト申請2'
    }
  ];
  
  const mockUsers = [
    {
      id: 'user-123',
      role: 'user',
      name: '一般ユーザー'
    },
    {
      id: 'admin-123',
      role: 'admin',
      name: '管理者'
    }
  ];
  
  const canDeleteApplication = (application, user) => {
    if (!user) return false;
    
    const isOwner = application.user_id === user.id;
    const isAdmin = user.role === 'admin';
    
    if (isOwner && application.status === 'pending') return true;
    if (isAdmin) return true;
    
    return false;
  };
  
  // テストケース
  const testCases = [
    {
      desc: '申請者本人 + 承認待ち',
      app: mockApplications[0],
      user: mockUsers[0],
      expected: true
    },
    {
      desc: '申請者本人 + 承認済み',
      app: mockApplications[1],
      user: { ...mockUsers[0], id: 'user-456' },
      expected: false
    },
    {
      desc: '管理者 + 承認済み',
      app: mockApplications[1],
      user: mockUsers[1],
      expected: true
    },
    {
      desc: '他人の申請 + 一般ユーザー',
      app: mockApplications[0],
      user: { ...mockUsers[0], id: 'other-user' },
      expected: false
    }
  ];
  
  testCases.forEach(testCase => {
    const result = canDeleteApplication(testCase.app, testCase.user);
    const status = result === testCase.expected ? '✅' : '❌';
    console.log(`  ${status} ${testCase.desc}: ${result ? '削除可能' : '削除不可'}`);
  });
};

const main = async () => {
  // 開発サーバーが起動しているかチェック
  try {
    const response = await fetch('http://localhost:3001/api/applications');
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }
    
    console.log('🌐 開発サーバー接続: OK\n');
    await testDeleteEndpoint();
    
  } catch (error) {
    console.log('⚠️  開発サーバーが起動していない可能性があります');
    console.log('   npm run dev を実行してからテストしてください\n');
  }
  
  testAuthMock();
  
  console.log('\n📝 削除機能が動作しない場合のチェックポイント:');
  console.log('  1. ユーザーが正しくログインしているか');
  console.log('  2. ユーザーの role が正しく設定されているか（admin/user）');
  console.log('  3. application.user_id がログインユーザーのIDと一致しているか');
  console.log('  4. 承認待ち以外の申請は管理者のみ削除可能');
  console.log('  5. ネットワークエラーやAPIエラーが発生していないか');
};

main().catch(console.error);