'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BarChart3, PieChart, TrendingUp, Users, Calendar, Filter } from 'lucide-react';
import { useMasterDataStore } from '@/lib/store';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

interface ExpenseData {
  id: string;
  amount: number;
  category_id: string;
  expense_date: string;
  status: string;
  user_id: string;
  user_name: string;
  event_id?: string;
  event_name?: string;
  project_id?: string;
  project_name?: string;
  description: string;
}

interface Event {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  budget: number;
  total_expenses: number;
}

interface User {
  id: string;
  name: string;
  department: string;
  avatar?: string;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'departments' | 'events' | 'projects'>('overview');
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { categories, projects, departments } = useMasterDataStore();

  // モックデータ
  const mockExpenseData: ExpenseData[] = [
    { 
      id: '1', 
      amount: 2500, 
      category_id: '1', 
      expense_date: '2024-01-15', 
      status: 'approved',
      user_id: '1',
      user_name: '田中太郎',
      event_id: '1',
      event_name: '東京展示会2024',
      project_id: '1',
      project_name: 'プロジェクトA',
      description: '交通費'
    },
    { 
      id: '2', 
      amount: 8000, 
      category_id: '2', 
      expense_date: '2024-01-14', 
      status: 'approved',
      user_id: '2',
      user_name: '佐藤花子',
      event_id: '1',
      event_name: '東京展示会2024',
      project_id: '2',
      project_name: 'プロジェクトB',
      description: '宿泊費'
    },
    { 
      id: '3', 
      amount: 3500, 
      category_id: '3', 
      expense_date: '2024-01-13', 
      status: 'approved',
      user_id: '3',
      user_name: '鈴木一郎',
      event_id: '2',
      event_name: '大阪商談会',
      project_id: '1',
      project_name: 'プロジェクトA',
      description: '会議費'
    },
    { 
      id: '4', 
      amount: 12000, 
      category_id: '4', 
      expense_date: '2024-01-12', 
      status: 'approved',
      user_id: '1',
      user_name: '田中太郎',
      event_id: '2',
      event_name: '大阪商談会',
      project_id: '2',
      project_name: 'プロジェクトB',
      description: '会場費'
    },
    { 
      id: '5', 
      amount: 5000, 
      category_id: '1', 
      expense_date: '2024-01-11', 
      status: 'approved',
      user_id: '4',
      user_name: '高橋美咲',
      event_id: '3',
      event_name: '名古屋セミナー',
      project_id: '3',
      project_name: 'プロジェクトC',
      description: '交通費'
    },
    { 
      id: '6', 
      amount: 3000, 
      category_id: '2', 
      expense_date: '2024-01-10', 
      status: 'approved',
      user_id: '2',
      user_name: '佐藤花子',
      event_id: '3',
      event_name: '名古屋セミナー',
      project_id: '1',
      project_name: 'プロジェクトA',
      description: '昬食代'
    },
  ];

  const mockEvents: Event[] = [
    {
      id: '1',
      name: '東京展示会2024',
      start_date: '2024-01-15',
      end_date: '2024-01-17',
      budget: 50000,
      total_expenses: 10500
    },
    {
      id: '2',
      name: '大阪商談会',
      start_date: '2024-01-20',
      end_date: '2024-01-22',
      budget: 30000,
      total_expenses: 15500
    },
    {
      id: '3',
      name: '名古屋セミナー',
      start_date: '2024-01-25',
      end_date: '2024-01-26',
      budget: 15000,
      total_expenses: 8000
    }
  ];

  const mockUsers: User[] = [
    { id: '1', name: '田中太郎', department: 'セールス' },
    { id: '2', name: '佐藤花子', department: 'マーケティング' },
    { id: '3', name: '鈴木一郎', department: 'カリキュラム' },
    { id: '4', name: '高橋美咲', department: 'コーチ' },
    { id: '5', name: '山田次郎', department: 'バックオフィス' },
    { id: '6', name: '伊藤三郎', department: '経営管理' }
  ];

  useEffect(() => {
    const activeProjects = projects.map(p => ({
      ...p,
      project_name: p.name
    }));
    const updatedExpenses = mockExpenseData.map(exp => ({
      ...exp,
      project_name: activeProjects.find(p => p.id === exp.project_id)?.name || '不明'
    }));
    setExpenseData(updatedExpenses);
    setEvents(mockEvents);
    setUsers(mockUsers);
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || '不明';
  };

  const getFilteredExpenses = () => {
    let filtered = expenseData;
    
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(expense => expense.event_id === selectedEvent);
    }
    
    if (selectedUser !== 'all') {
      filtered = filtered.filter(expense => expense.user_id === selectedUser);
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(expense => {
        const user = users.find(u => u.id === expense.user_id);
        return user?.department === selectedDepartment;
      });
    }
    
    return filtered;
  };

  const getTotalAmount = () => {
    return getFilteredExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    getFilteredExpenses().forEach(expense => {
      const categoryName = getCategoryName(expense.category_id);
      breakdown[categoryName] = (breakdown[categoryName] || 0) + expense.amount;
    });
    return breakdown;
  };

  const getEventBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    getFilteredExpenses().forEach(expense => {
      const eventName = expense.event_name || 'イベントなし';
      breakdown[eventName] = (breakdown[eventName] || 0) + expense.amount;
    });
    return breakdown;
  };

  const getUserBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    getFilteredExpenses().forEach(expense => {
      breakdown[expense.user_name] = (breakdown[expense.user_name] || 0) + expense.amount;
    });
    return breakdown;
  };

  const getDepartmentBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    getFilteredExpenses().forEach(expense => {
      const user = users.find(u => u.id === expense.user_id);
      const department = user?.department || '不明';
      breakdown[department] = (breakdown[department] || 0) + expense.amount;
    });
    return breakdown;
  };

  const getMonthlyTrend = () => {
    const monthlyData: { [key: string]: number } = {};
    getFilteredExpenses().forEach(expense => {
      const month = expense.expense_date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + expense.amount;
    });
    return monthlyData;
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['日付', 'イベント', '申請者', 'カテゴリ', '金額', 'ステータス', '説明'],
      ...getFilteredExpenses().map(expense => [
        expense.expense_date,
        expense.event_name || '',
        expense.user_name,
        getCategoryName(expense.category_id),
        expense.amount.toString(),
        expense.status,
        expense.description
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const categoryBreakdown = getCategoryBreakdown();
  const eventBreakdown = getEventBreakdown();
  const userBreakdown = getUserBreakdown();
  const departmentBreakdown = getDepartmentBreakdown();
  const monthlyTrend = getMonthlyTrend();

  // グラフ用データの準備
  const categoryChartData = Object.entries(categoryBreakdown).map(([name, value]) => ({ name, value }));
  const departmentChartData = Object.entries(departmentBreakdown).map(([name, value]) => ({ name, value }));
  const monthlyChartData = Object.entries(monthlyTrend).map(([month, amount]) => ({ month, amount }));
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">レポート</h1>
            <p className="text-gray-600">経費の分析とレポートを確認できます</p>
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="期間を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">今月</SelectItem>
                <SelectItem value="last_month">先月</SelectItem>
                <SelectItem value="last_3_months">過去3ヶ月</SelectItem>
                <SelectItem value="current_year">今年</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV出力
            </Button>
          </div>
        </div>

        {/* フィルター */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              フィルター
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">イベント:</span>
                <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="イベントを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのイベント</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">ユーザー:</span>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="ユーザーを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべてのユーザー</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.department})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">部門:</span>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="部門を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">すべての部門</SelectItem>
                    <SelectItem value="セールス">セールス</SelectItem>
                    <SelectItem value="マーケティング">マーケティング</SelectItem>
                    <SelectItem value="カリキュラム">カリキュラム</SelectItem>
                    <SelectItem value="コーチ">コーチ</SelectItem>
                    <SelectItem value="バックオフィス">バックオフィス</SelectItem>
                    <SelectItem value="経営管理">経営管理</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="overview">概要</TabsTrigger>
            <TabsTrigger value="departments">部門別</TabsTrigger>
            <TabsTrigger value="events">イベント別</TabsTrigger>
            <TabsTrigger value="projects">プロジェクト別</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">総支出額</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{getTotalAmount().toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    選択期間の合計
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">申請件数</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getFilteredExpenses().length}</div>
                  <p className="text-xs text-muted-foreground">
                    件の申請
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">平均金額</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ¥{getFilteredExpenses().length > 0 ? Math.round(getTotalAmount() / getFilteredExpenses().length).toLocaleString() : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    申請あたりの平均
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">参加イベント数</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Object.keys(eventBreakdown).length}</div>
                  <p className="text-xs text-muted-foreground">
                    イベント数
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* カテゴリ別内訳 */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別支出</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie 
                      data={categoryChartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      fill="#8884d8"
                      label
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 部門別内訳 */}
            <Card>
              <CardHeader>
                <CardTitle>部門別支出</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie 
                      data={departmentChartData} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      fill="#8884d8"
                      label
                    >
                      {departmentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 月次支出推移 */}
            <Card>
              <CardHeader>
                <CardTitle>月次支出推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            {/* イベント別分析 */}
            <Card>
              <CardHeader>
                <CardTitle>イベント別支出</CardTitle>
                <CardDescription>
                  イベントごとの支出金額と予算対比
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {events.map(event => {
                    const eventExpenses = expenseData.filter(expense => expense.event_id === event.id);
                    const totalExpense = eventExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                    const budgetUsage = (totalExpense / event.budget) * 100;
                    
                    return (
                      <div key={event.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{event.name}</h3>
                            <p className="text-sm text-gray-500">
                              {event.start_date} - {event.end_date}
                            </p>
                          </div>
                          <Badge className={budgetUsage > 100 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                            {budgetUsage.toFixed(1)}%使用
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">予算:</span>
                            <span className="font-medium ml-2">¥{event.budget.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">支出:</span>
                            <span className="font-medium ml-2">¥{totalExpense.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">残り:</span>
                            <span className="font-medium ml-2">¥{(event.budget - totalExpense).toLocaleString()}</span>
                          </div>
                        </div>
                        {eventExpenses.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">詳細支出</h4>
                            <div className="space-y-2">
                              {eventExpenses.map(expense => (
                                <div key={expense.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{expense.user_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{expense.user_name}</span>
                                    <span className="text-gray-500">-</span>
                                    <span>{getCategoryName(expense.category_id)}</span>
                                  </div>
                                  <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            {/* ユーザー別分析 */}
            <Card>
              <CardHeader>
                <CardTitle>ユーザー別支出</CardTitle>
                <CardDescription>
                  ユーザーごとの支出金額と内訳
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {users.map(user => {
                    const userExpenses = expenseData.filter(expense => expense.user_id === user.id);
                    const totalExpense = userExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                    const categoryBreakdown: { [key: string]: number } = {};
                    userExpenses.forEach(expense => {
                      const categoryName = getCategoryName(expense.category_id);
                      categoryBreakdown[categoryName] = (categoryBreakdown[categoryName] || 0) + expense.amount;
                    });
                    
                    return (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-lg">{user.name}</h3>
                              <p className="text-sm text-gray-500">{user.department}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">¥{totalExpense.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">{userExpenses.length}件の申請</div>
                          </div>
                        </div>
                        {Object.keys(categoryBreakdown).length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">カテゴリ別内訳</h4>
                            <div className="space-y-2">
                              {Object.entries(categoryBreakdown).map(([category, amount]) => (
                                <div key={category} className="flex items-center justify-between text-sm">
                                  <span>{category}</span>
                                  <span className="font-medium">¥{amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {userExpenses.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium mb-2">最近の申請</h4>
                            <div className="space-y-2">
                              {userExpenses.slice(0, 3).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <span>{expense.event_name || 'イベントなし'}</span>
                                    <span className="text-gray-500">-</span>
                                    <span>{getCategoryName(expense.category_id)}</span>
                                  </div>
                                  <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {/* プロジェクト別分析 */}
            <Card>
              <CardHeader>
                <CardTitle>プロジェクト別予算と支出</CardTitle>
                <CardDescription>
                  プロジェクトごとの予算、支出金額、残額
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {projects.map(project => {
                    const projectExpenses = expenseData.filter(expense => expense.project_id === project.id);
                    const totalExpense = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                    const budgetUsage = (totalExpense / project.budget) * 100;
                    const remaining = project.budget - totalExpense;
                    const department = departments.find(d => d.id === project.department_id);
                    
                    return (
                      <div key={project.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{project.name}</h3>
                            <p className="text-sm text-gray-500">
                              コード: {project.code} | 部門: {department?.name || '不明'}
                            </p>
                            <p className="text-sm text-gray-500">
                              ステータス: {project.status === 'active' ? 'アクティブ' : project.status === 'completed' ? '完了' : '停止中'}
                            </p>
                          </div>
                          <Badge className={budgetUsage > 100 ? 'bg-red-100 text-red-800' : budgetUsage > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {budgetUsage.toFixed(1)}%使用
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">予算:</span>
                            <span className="font-medium ml-2">¥{project.budget.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">支出:</span>
                            <span className="font-medium ml-2">¥{totalExpense.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">残り:</span>
                            <span className={`font-medium ml-2 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>¥{remaining.toLocaleString()}</span>
                          </div>
                        </div>
                        {projectExpenses.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">最近の申請 ({projectExpenses.length}件)</h4>
                            <div className="space-y-2">
                              {projectExpenses.slice(0, 3).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{expense.user_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{expense.user_name}</span>
                                    <span className="text-gray-500">-</span>
                                    <span>{getCategoryName(expense.category_id)}</span>
                                  </div>
                                  <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            {/* 部門別分析 */}
            <Card>
              <CardHeader>
                <CardTitle>部門別予算と支出</CardTitle>
                <CardDescription>
                  部門ごとの予算、支出金額、残額
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {departments.map(dept => {
                    const departmentUsers = users.filter(user => user.department === dept.name);
                    const departmentExpenses = expenseData.filter(expense => {
                      const user = users.find(u => u.id === expense.user_id);
                      return user?.department === dept.name;
                    });
                    const totalExpense = departmentExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                    const budgetUsage = (totalExpense / dept.budget) * 100;
                    const remaining = dept.budget - totalExpense;
                    
                    return (
                      <div key={dept.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{dept.name}</h3>
                            <p className="text-sm text-gray-500">
                              {departmentUsers.length}人のメンバー
                            </p>
                          </div>
                          <Badge className={budgetUsage > 100 ? 'bg-red-100 text-red-800' : budgetUsage > 80 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                            {budgetUsage.toFixed(1)}%使用
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500">予算:</span>
                            <span className="font-medium ml-2">¥{dept.budget.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">支出:</span>
                            <span className="font-medium ml-2">¥{totalExpense.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">残り:</span>
                            <span className={`font-medium ml-2 ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>¥{remaining.toLocaleString()}</span>
                          </div>
                        </div>
                        {departmentExpenses.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">最近の申請 ({departmentExpenses.length}件)</h4>
                            <div className="space-y-2">
                              {departmentExpenses.slice(0, 3).map(expense => (
                                <div key={expense.id} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center space-x-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback>{expense.user_name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{expense.user_name}</span>
                                    <span className="text-gray-500">-</span>
                                    <span>{getCategoryName(expense.category_id)}</span>
                                  </div>
                                  <span className="font-medium">¥{expense.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 詳細一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>詳細一覧</CardTitle>
            <CardDescription>
              選択条件の申請詳細
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredExpenses().map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{expense.user_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{expense.user_name}</p>
                      <p className="text-sm text-gray-500">{expense.event_name || 'イベントなし'}</p>
                      <p className="text-sm text-gray-500">{expense.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">¥{expense.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{getCategoryName(expense.category_id)}</p>
                    </div>
                    <Badge className={expense.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {expense.status === 'approved' ? '承認済み' : '承認待ち'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
} 