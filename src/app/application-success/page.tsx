'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ApplicationSuccessPage() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type'); // 'expense' or 'invoice'
  const amount = searchParams.get('amount');
  const description = searchParams.get('description');

  const getTypeLabel = () => {
    switch (type) {
      case 'expense':
        return '経費申請';
      case 'invoice':
        return '請求書払い申請';
      default:
        return '申請';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-2">
            {getTypeLabel()}が完了しました！
          </h1>
          <p className="text-gray-600">
            申請が正常に送信されました。承認をお待ちください。
          </p>
        </div>

        {/* 申請内容確認カード */}
        <Card>
          <CardHeader>
            <CardTitle>申請内容</CardTitle>
            <CardDescription>
              送信された申請の詳細です
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">申請種別</span>
                <span className="font-medium">{getTypeLabel()}</span>
              </div>
              {description && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">内容</span>
                  <span className="font-medium">{description}</span>
                </div>
              )}
              {amount && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">金額</span>
                  <span className="font-medium text-lg">¥{parseInt(amount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">ステータス</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  承認待ち
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクションカード */}
        <Card>
          <CardHeader>
            <CardTitle>次のアクション</CardTitle>
            <CardDescription>
              続けて申請を行うか、ダッシュボードで状況を確認できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/expenses/new">
                <Button className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                  <Plus className="h-5 w-5" />
                  <span>経費申請を作成</span>
                </Button>
              </Link>
              <Link href="/invoice-payments/new">
                <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center space-y-2">
                  <Plus className="h-5 w-5" />
                  <span>請求書払い申請を作成</span>
                </Button>
              </Link>
            </div>
            <div className="mt-4">
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full h-12 flex items-center justify-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>ダッシュボードを確認</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 注意事項 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">申請について</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• 申請は承認者に自動的に通知されます</li>
                  <li>• 承認状況はダッシュボードで確認できます</li>
                  <li>• 承認完了後にメール通知が送信されます</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
