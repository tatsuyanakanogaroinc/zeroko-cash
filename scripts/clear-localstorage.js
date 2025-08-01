#!/usr/bin/env node

console.log('📝 ローカルストレージクリア手順')
console.log('')
console.log('以下の手順でブラウザのローカルストレージをクリアしてください：')
console.log('')
console.log('1️⃣ ブラウザでアプリケーションを開く')
console.log('2️⃣ 開発者ツールを開く（F12 または Cmd+Option+I）')
console.log('3️⃣ コンソールタブを選択')
console.log('4️⃣ 以下のコマンドを実行：')
console.log('')
console.log('   localStorage.clear();')
console.log('   sessionStorage.clear();')
console.log('')
console.log('または、以下の個別削除コマンド：')
console.log('')
console.log('   localStorage.removeItem("expense-storage");')
console.log('   localStorage.removeItem("event-storage");')
console.log('   localStorage.removeItem("master-data-storage");')
console.log('')
console.log('5️⃣ ページをリロード（F5 または Cmd+R）')
console.log('')
console.log('✅ これで古いサンプルデータが削除され、データベースから正しいデータが読み込まれます')
