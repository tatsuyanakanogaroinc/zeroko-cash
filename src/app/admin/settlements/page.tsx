'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, CreditCard, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SettlementData {
  expenses: any[];
  invoices: any[];
  subcontracts: any[];
}

interface ProcessingItem {
  id: string;
  type: 'expense' | 'invoice' | 'subcontract';
  amount: number;
  description: string;
  applicant: string;
  date: string;
}

export default function SettlementsPage() {
  const [settlementData, setSettlementData] = useState<SettlementData>({
    expenses: [],
    invoices: [],
    subcontracts: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 処理ダイアログの状態
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ProcessingItem | null>(null);
  const [processAmount, setProcessAmount] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  
  const { user } = useAuth();

  useEffect(() => {
    loadSettlementData();
  }, [activeTab]);

  const loadSettlementData = async () => {
    setIsLoading(true);
    try {
      const status = activeTab === 'pending' ? 'approved' : 
                   activeTab === 'settled' ? 'settled' : 
                   'paid';
      
      const response = await fetch(`/api/settlements?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettlementData(data.data);
        }
      }
    } catch (error) {
      console.error('精算データの取得に失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessClick = (item: any, type: 'expense' | 'invoice' | 'subcontract') => {
    const processItem: ProcessingItem = {
      id: item.id,
      type,
      amount: item.amount || item.contract_amount,
      description: item.description || item.purpose || item.contract_title,
      applicant: item.users?.name || item.contractor_name || '',
      date: item.expense_date || item.invoice_date || item.start_date
    };
    
    setSelectedItem(processItem);
    setProcessAmount(processItem.amount.toString());
    setProcessNotes('');
    setProcessDialogOpen(true);
  };

  const executeProcess = async () => {
    if (!selectedItem || !user) return;

    setIsProcessing(true);
    try {
      const processType = selectedItem.type === 'expense' ? 'settle' : 'pay';
      const requestData = {
        type: processType,
        targetType: selectedItem.type,
        targetId: selectedItem.id,
        amount: parseFloat(processAmount),
        processedBy: user.id,
        notes: processNotes.trim() || null
      };

      const response = await fetch('/api/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '処理に失敗しました');
      }

      alert(result.message || '処理が完了しました');
      setProcessDialogOpen(false);
      setSelectedItem(null);
      await loadSettlementData();
    } catch (error) {
      console.error('処理エラー:', error);
      alert(`処理に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ja-JP') + '円';
  };

  const getStatusBadge = (status: string, type: 'expense' | 'invoice' | 'subcontract') => {
    if (type === 'expense') {
      switch (status) {
        case 'approved':
          return <Badge variant="default" className="bg-blue-100 text-blue-800">精算待ち</Badge>;
        case 'settled':
          return <Badge variant="default" className="bg-green-100 text-green-800">精算済み</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'approved':
          return <Badge variant="default" className="bg-orange-100 text-orange-800">支払い待ち</Badge>;
        case 'paid':
          return <Badge variant="default" className="bg-green-100 text-green-800">支払い済み</Badge>;
        case 'active':
        case 'completed':
        case 'pending_payment':
          return <Badge variant="default" className="bg-orange-100 text-orange-800">支払い待ち</Badge>;
        default:
          return <Badge variant="secondary">{status}</Badge>;
      }
    }
  };

  // 統計計算
  const stats = {
    pendingExpenses: settlementData.expenses.filter(e => e.status === 'approved').length,
    pendingInvoices: settlementData.invoices.filter(i => i.status === 'approved').length,
    pendingSubcontracts: settlementData.subcontracts.filter(s => 
      ['active', 'completed', 'pending_payment'].includes(s.status) && !s.paid_at
    ).length,
    settledExpenses: settlementData.expenses.filter(e => e.status === 'settled').length,
    paidInvoices: settlementData.invoices.filter(i => i.status === 'paid').length,
    paidSubcontracts: settlementData.subcontracts.filter(s => s.paid_at).length
  };

  const totalPending = stats.pendingExpenses + stats.pendingInvoices + stats.pendingSubcontracts;
  const totalProcessed = stats.settledExpenses + stats.paidInvoices + stats.paidSubcontracts;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">読み込み中...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">精算・支払い処理</h1>
          <p className="text-gray-600 mt-2">承認済みの申請に対する精算・支払い処理を行います</p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理待ち</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPending}</div>
              <p className="text-xs text-muted-foreground">
                経費{stats.pendingExpenses}件・請求書{stats.pendingInvoices}件・外注{stats.pendingSubcontracts}件
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">処理済み</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProcessed}</div>
              <p className="text-xs text-muted-foreground">
                精算{stats.settledExpenses}件・支払い{stats.paidInvoices + stats.paidSubcontracts}件
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の処理金額</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">集計機能は今後追加予定</p>
            </CardContent>
          </Card>
        </div>

        {/* メイン処理エリア */}
        <Card>
          <CardHeader>
            <CardTitle>精算・支払い一覧</CardTitle>
            <CardDescription>
              処理が必要な申請と処理済み申請を管理できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  処理待ち ({totalPending})
                </TabsTrigger>
                <TabsTrigger value="processed">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  処理済み ({totalProcessed})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {/* 経費申請 */}
                {settlementData.expenses.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                      経費申請 ({settlementData.expenses.length}件)
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>申請日</TableHead>
                          <TableHead>申請者</TableHead>
                          <TableHead>説明</TableHead>
                          <TableHead>金額</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>処理</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementData.expenses.map((expense) => (
                          <TableRow key={expense.id}>
                            <TableCell>{formatDate(expense.expense_date)}</TableCell>
                            <TableCell>{expense.users?.name}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{formatAmount(expense.amount)}</TableCell>
                            <TableCell>{getStatusBadge(expense.status, 'expense')}</TableCell>
                            <TableCell>
                              {expense.status === 'approved' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessClick(expense, 'expense')}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  精算処理
                                </Button>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {formatDate(expense.settled_at)} {expense.settled_by_user?.name}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* 請求書払い */}
                {settlementData.invoices.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
                      請求書払い ({settlementData.invoices.length}件)
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>申請日</TableHead>
                          <TableHead>申請者</TableHead>
                          <TableHead>説明</TableHead>
                          <TableHead>支払先</TableHead>
                          <TableHead>金額</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>処理</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementData.invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                            <TableCell>{invoice.users?.name}</TableCell>
                            <TableCell>{invoice.purpose}</TableCell>
                            <TableCell>{invoice.vendor}</TableCell>
                            <TableCell>{formatAmount(invoice.amount)}</TableCell>
                            <TableCell>{getStatusBadge(invoice.status, 'invoice')}</TableCell>
                            <TableCell>
                              {invoice.status === 'approved' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessClick(invoice, 'invoice')}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  支払い処理
                                </Button>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {formatDate(invoice.paid_at)} {invoice.paid_by_user?.name}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* 外注契約 */}
                {settlementData.subcontracts.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-orange-600" />
                      外注契約 ({settlementData.subcontracts.length}件)
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>開始日</TableHead>
                          <TableHead>契約先</TableHead>
                          <TableHead>契約内容</TableHead>
                          <TableHead>金額</TableHead>
                          <TableHead>ステータス</TableHead>
                          <TableHead>処理</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {settlementData.subcontracts.map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell>{formatDate(contract.start_date)}</TableCell>
                            <TableCell>{contract.contractor_name}</TableCell>
                            <TableCell>{contract.contract_title}</TableCell>
                            <TableCell>{formatAmount(contract.contract_amount)}</TableCell>
                            <TableCell>{getStatusBadge(contract.status, 'subcontract')}</TableCell>
                            <TableCell>
                              {!contract.paid_at ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessClick(contract, 'subcontract')}
                                  className="bg-orange-600 hover:bg-orange-700"
                                >
                                  支払い処理
                                </Button>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {formatDate(contract.paid_at)} {contract.paid_by_user?.name}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* データなしの場合 */}
                {settlementData.expenses.length === 0 && 
                 settlementData.invoices.length === 0 && 
                 settlementData.subcontracts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {activeTab === 'pending' ? '処理待ちの申請はありません' : '処理済みの申請はありません'}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 処理ダイアログ */}
        <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.type === 'expense' ? '精算処理' : '支払い処理'}
              </DialogTitle>
              <DialogDescription>
                {selectedItem?.type === 'expense' ? '経費申請の精算を行います' : '請求書・外注費の支払いを行います'}
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>申請者:</strong> {selectedItem.applicant}</div>
                    <div><strong>申請日:</strong> {formatDate(selectedItem.date)}</div>
                    <div className="col-span-2"><strong>内容:</strong> {selectedItem.description}</div>
                    <div><strong>申請金額:</strong> {formatAmount(selectedItem.amount)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process_amount">処理金額 *</Label>
                  <Input
                    id="process_amount"
                    type="number"
                    value={processAmount}
                    onChange={(e) => setProcessAmount(e.target.value)}
                    placeholder="実際の処理金額を入力"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process_notes">メモ</Label>
                  <Textarea
                    id="process_notes"
                    value={processNotes}
                    onChange={(e) => setProcessNotes(e.target.value)}
                    placeholder="処理に関するメモがあれば入力してください"
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProcessDialogOpen(false)}
                disabled={isProcessing}
              >
                キャンセル
              </Button>
              <Button
                onClick={executeProcess}
                disabled={isProcessing || !processAmount}
              >
                {isProcessing ? '処理中...' : selectedItem?.type === 'expense' ? '精算実行' : '支払い実行'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}