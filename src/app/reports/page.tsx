'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  Calendar, 
  FolderOpen,
  Eye,
  BarChart3,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Tag,
  X
} from 'lucide-react';

interface Summary {
  id: string;
  name: string;
  budget: number;
  total_expenses: number;
  remaining: number;
  usage_percentage: number;
  status: 'healthy' | 'warning' | 'danger';
}

interface Department {
  id: string;
  name: string;
  budget: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  budget: number;
  department_id: string;
  status: string;
  created_at: string;
}

interface Event {
  id: string;
  name: string;
  budget: number;
  description?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  budget: number;
  created_at: string;
}

interface ReportData {
  expenses: any[];
  invoicePayments: any[];
  departments: Department[];
  projects: Project[];
  events: Event[];
  categories: Category[];
  departmentExpenses: Record<string, number>;
  projectExpenses: Record<string, number>;
  eventExpenses: Record<string, number>;
  categoryExpenses: Record<string, number>;
}

interface ExpenseDetail {
  id: string;
  date: string;
  amount: number;
  category: string;
  user_name: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Summary | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);

  // Fetch all report data from API
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const response = await fetch('/api/reports-data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReportData(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch report data');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []);

  // Calculate usage percentage and status
  const calculateSummary = (budget: number, expenses: number): { usage_percentage: number; status: 'healthy' | 'warning' | 'danger' } => {
    const usage = budget > 0 ? (expenses / budget) * 100 : 0;
    let status: 'healthy' | 'warning' | 'danger' = 'healthy';
    if (usage >= 90) status = 'danger';
    else if (usage >= 70) status = 'warning';
    return { usage_percentage: usage, status };
  };

  // Convert Supabase data to Summary format with real expense data
  const departments: Summary[] = reportData?.departments?.map(d => {
    const budget = typeof d.budget === 'number' && !isNaN(d.budget) ? d.budget : 0;
    const expenses = reportData?.departmentExpenses[d.id] || 0;
    const summary = calculateSummary(budget, expenses);
    return {
      id: d.id,
      name: d.name,
      budget: budget,
      total_expenses: expenses,
      remaining: budget - expenses,
      ...summary
    };
  }) || [];

  const projects: Summary[] = reportData?.projects?.map(p => {
    const budget = typeof p.budget === 'number' && !isNaN(p.budget) ? p.budget : 0;
    const expenses = reportData?.projectExpenses[p.id] || 0;
    const summary = calculateSummary(budget, expenses);
    return {
      id: p.id,
      name: p.name,
      budget: budget,
      total_expenses: expenses,
      remaining: budget - expenses,
      ...summary
    };
  }) || [];

  const events: Summary[] = reportData?.events?.map(e => {
    const budget = typeof e.budget === 'number' && !isNaN(e.budget) ? e.budget : 0;
    const expenses = reportData?.eventExpenses[e.id] || 0;
    const summary = calculateSummary(budget, expenses);
    return {
      id: e.id,
      name: e.name,
      budget: budget,
      total_expenses: expenses,
      remaining: budget - expenses,
      ...summary
    };
  }) || [];

  const categories: Summary[] = reportData?.categories?.map(c => {
    const budget = typeof c.budget === 'number' && !isNaN(c.budget) ? c.budget : 0;
    const expenses = reportData?.categoryExpenses[c.id] || 0;
    const summary = calculateSummary(budget, expenses);
    return {
      id: c.id,
      name: c.name,
      budget: budget,
      total_expenses: expenses,
      remaining: budget - expenses,
      ...summary
    };
  }) || [];

  // Get real expenses for categories
  const getExpensesForCategory = (categoryId: string): ExpenseDetail[] => {
    if (!reportData) return [];
    
    const allExpenses = [...(reportData.expenses || []), ...(reportData.invoicePayments || [])];
    
    const filteredExpenses = allExpenses.filter(expense => expense.category_id === categoryId);
    
    return filteredExpenses.map(expense => ({
      id: expense.id,
      date: new Date(expense.created_at).toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.categories?.name || '未分類',
      user_name: expense.users?.name || '不明',
      description: expense.description || expense.purpose || '説明なし',
      status: expense.status || 'approved'
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Get monthly expense data for trends
  const getMonthlyExpenses = (itemId: string, itemType: 'department' | 'project' | 'event' | 'category'): number[] => {
    if (!reportData) return Array(6).fill(0);
    
    const allExpenses = [...(reportData.expenses || []), ...(reportData.invoicePayments || [])];
    let filteredExpenses = [];
    
    if (itemType === 'department') {
      filteredExpenses = allExpenses.filter(expense => 
        (expense.users?.department_id === itemId) || (expense.department_id === itemId)
      );
    } else if (itemType === 'project') {
      filteredExpenses = allExpenses.filter(expense => expense.project_id === itemId);
    } else if (itemType === 'event') {
      filteredExpenses = allExpenses.filter(expense => expense.event_id === itemId);
    } else if (itemType === 'category') {
      filteredExpenses = allExpenses.filter(expense => expense.category_id === itemId);
    }
    
    // Group by month (last 6 months)
    const monthlyTotals = Array(6).fill(0);
    const currentDate = new Date();
    
    filteredExpenses.forEach(expense => {
      const expenseDate = new Date(expense.created_at);
      const monthDiff = (currentDate.getFullYear() - expenseDate.getFullYear()) * 12 + 
                       currentDate.getMonth() - expenseDate.getMonth();
      
      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyTotals[5 - monthDiff] += expense.amount;
      }
    });
    
    return monthlyTotals;
  };

  // Get real expenses for details from API data
  const getExpensesForItem = (itemId: string, itemType: 'department' | 'project' | 'event'): ExpenseDetail[] => {
    if (!reportData) return [];
    
    const allExpenses = [...(reportData.expenses || []), ...(reportData.invoicePayments || [])];
    
    let filteredExpenses = [];
    
    if (itemType === 'department') {
      filteredExpenses = allExpenses.filter(expense => 
        (expense.users?.department_id === itemId) || (expense.department_id === itemId)
      );
    } else if (itemType === 'project') {
      filteredExpenses = allExpenses.filter(expense => expense.project_id === itemId);
    } else if (itemType === 'event') {
      filteredExpenses = allExpenses.filter(expense => expense.event_id === itemId);
    }
    
    return filteredExpenses.map(expense => ({
      id: expense.id,
      date: new Date(expense.created_at).toISOString().split('T')[0],
      amount: expense.amount,
      category: expense.categories?.name || '未分類',
      user_name: expense.users?.name || '不明',
      description: expense.description || expense.purpose || '説明なし',
      status: expense.status || 'approved'
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  // Calculate totals for overview
  const totalBudget = [...departments, ...projects, ...events].reduce((sum, item) => sum + item.budget, 0);
  const totalExpenses = [...departments, ...projects, ...events].reduce((sum, item) => sum + item.total_expenses, 0);
  const totalRemaining = totalBudget - totalExpenses;
  const overallUsage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;
  
  // Calculate statistics
  const healthyCount = [...departments, ...projects, ...events].filter(item => item.status === 'healthy').length;
  const warningCount = [...departments, ...projects, ...events].filter(item => item.status === 'warning').length;
  const dangerCount = [...departments, ...projects, ...events].filter(item => item.status === 'danger').length;
  const totalItems = departments.length + projects.length + events.length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'danger': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Open detail panel function
  const openDetailPanel = (item: Summary) => {
    setSelectedItem(item);
    setDetailPanelOpen(true);
  };

  // Close detail panel function
  const closeDetailPanel = () => {
    setDetailPanelOpen(false);
    setSelectedItem(null);
  };

  const CategoryCard = ({ item, icon: Icon, type }: { item: Summary; icon: any; type: string }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
          </div>
          <Badge className={getStatusColor(item.status)}>
            {item.status === 'healthy' ? '健全' : item.status === 'warning' ? '要注意' : '危険'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-purple-600 font-semibold">予算</div>
            <div className="text-lg font-bold text-purple-800">¥{item.budget.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-orange-600 font-semibold">使用額</div>
            <div className="text-lg font-bold text-orange-800">¥{item.total_expenses.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 font-semibold">残額</div>
            <div className="text-lg font-bold text-green-800">¥{item.remaining.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>使用率</span>
            <span className="font-semibold">{item.usage_percentage.toFixed(1)}%</span>
          </div>
          <Progress value={item.usage_percentage} className="h-2" />
        </div>
        
        <div className="flex justify-end">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => openDetailPanel(item)}>
                  <Eye className="h-3 w-3 mr-1" />
                  詳細を見る
                </Button>
        </div>
      </CardContent>
    </Card>
  );

  const SummaryCard = ({ item, icon: Icon, type }: { item: Summary; icon: any; type: string }) => (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
          </div>
          <Badge className={getStatusColor(item.status)}>
            {item.status === 'healthy' ? '健全' : item.status === 'warning' ? '要注意' : '危険'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-semibold">予算</div>
            <div className="text-lg font-bold text-blue-800">¥{item.budget.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-orange-600 font-semibold">使用額</div>
            <div className="text-lg font-bold text-orange-800">¥{item.total_expenses.toLocaleString()}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-green-600 font-semibold">残額</div>
            <div className="text-lg font-bold text-green-800">¥{item.remaining.toLocaleString()}</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>使用率</span>
            <span className="font-semibold">{item.usage_percentage.toFixed(1)}%</span>
          </div>
          <Progress value={item.usage_percentage} className="h-2" />
        </div>
        
        <div className="flex justify-end">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => openDetailPanel(item)}>
                <Eye className="h-3 w-3 mr-1" />
                詳細を見る
              </Button>
            <DialogContent className="max-w-none w-[95vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span>{item.name} - 申請詳細</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-8 mt-6">
                {/* Summary */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-blue-600 font-semibold text-sm">予算</div>
                    <div className="text-2xl font-bold text-blue-800">¥{item.budget.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-orange-600 font-semibold text-sm">使用額</div>
                    <div className="text-2xl font-bold text-orange-800">¥{item.total_expenses.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-green-600 font-semibold text-sm">残額</div>
                    <div className="text-2xl font-bold text-green-800">¥{item.remaining.toLocaleString()}</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-600 font-semibold text-sm">使用率</div>
                    <div className="text-2xl font-bold text-gray-800">{item.usage_percentage.toFixed(1)}%</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>予算使用状況</span>
                    <span>{item.usage_percentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.usage_percentage} className="h-3" />
                </div>
                
                {/* Analysis Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Category Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        <span>勘定科目別支出</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const itemType = departments.find(d => d.id === item.id) ? 'department' : 
                                         projects.find(p => p.id === item.id) ? 'project' : 'event';
                          const expenses = getExpensesForItem(item.id, itemType);
                          const categoryTotals = expenses.reduce((acc, expense) => {
                            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          if (Object.keys(categoryTotals).length === 0) {
                            return <div className="text-center text-gray-500 py-4">経費データがありません</div>;
                          }
                          
                          return Object.entries(categoryTotals)
                            .sort(([,a], [,b]) => b - a)
                            .map(([category, amount]) => {
                              const percentage = item.total_expenses > 0 ? (amount / item.total_expenses) * 100 : 0;
                              return (
                                <div key={category} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{category}</span>
                                    <div className="text-right">
                                      <div className="font-semibold">¥{amount.toLocaleString()}</div>
                                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                                    </div>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* User Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5 text-green-600" />
                        <span>ユーザー別支出</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const itemType = departments.find(d => d.id === item.id) ? 'department' : 
                                         projects.find(p => p.id === item.id) ? 'project' : 'event';
                          const expenses = getExpensesForItem(item.id, itemType);
                          const userTotals = expenses.reduce((acc, expense) => {
                            if (!acc[expense.user_name]) {
                              acc[expense.user_name] = { total: 0, count: 0 };
                            }
                            acc[expense.user_name].total += expense.amount;
                            acc[expense.user_name].count += 1;
                            return acc;
                          }, {} as Record<string, { total: number; count: number }>);
                          
                          if (Object.keys(userTotals).length === 0) {
                            return <div className="text-center text-gray-500 py-4">経費データがありません</div>;
                          }
                          
                          return Object.entries(userTotals)
                            .sort(([,a], [,b]) => b.total - a.total)
                            .map(([userName, data]) => {
                              const percentage = item.total_expenses > 0 ? (data.total / item.total_expenses) * 100 : 0;
                              return (
                                <div key={userName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                        {userName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">{userName}</div>
                                      <div className="text-xs text-gray-500">{data.count}件の申請</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">¥{data.total.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Monthly Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span>月別支出推移</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-6 gap-4">
                      {(() => {
                        const currentDate = new Date();
                        const months = [];
                        const itemType = departments.find(d => d.id === item.id) ? 'department' : 
                                       projects.find(p => p.id === item.id) ? 'project' : 
                                       categories.find(c => c.id === item.id) ? 'category' : 'event';
                        const monthlyAmounts = getMonthlyExpenses(item.id, itemType);
                        const maxAmount = Math.max(...monthlyAmounts, 1);
                        
                        // Generate month labels (last 6 months)
                        for (let i = 5; i >= 0; i--) {
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                          months.push(`${date.getMonth() + 1}月`);
                        }
                        
                        return months.map((month, index) => {
                          const amount = monthlyAmounts[index];
                          const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                          return (
                            <div key={month} className="text-center">
                              <div className="text-xs text-gray-600 mb-2">{month}</div>
                              <div className="h-20 bg-gray-100 rounded relative flex items-end justify-center">
                                <div 
                                  className="bg-purple-500 rounded w-full transition-all duration-300" 
                                  style={{ height: `${Math.max(percentage, 5)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs font-medium mt-2">¥{amount.toLocaleString()}</div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Detailed Expenses List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                      <span>申請詳細一覧</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(() => {
                        const itemType = departments.find(d => d.id === item.id) ? 'department' : 
                                       projects.find(p => p.id === item.id) ? 'project' : 'event';
                        const expenses = getExpensesForItem(item.id, itemType);
                        
                        if (expenses.length === 0) {
                          return <div className="text-center text-gray-500 py-8">経費データがありません</div>;
                        }
                        
                        return expenses.map(expense => (
                          <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                  {expense.user_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{expense.user_name}</div>
                                <div className="text-sm text-gray-600">{expense.category} - {expense.description}</div>
                                <div className="text-xs text-gray-500">{expense.date}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-lg font-semibold">¥{expense.amount.toLocaleString()}</div>
                              </div>
                              <Badge className={
                                expense.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : expense.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }>
                                {expense.status === 'approved' ? '承認済み' : expense.status === 'pending' ? '承認待ち' : '却下'}
                              </Badge>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
      </CardContent>
    </Card>
  );

  // Show loading state while data is loading
  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">レポートデータを読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show error state if data fetch failed
  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-lg font-semibold">データの読み込みに失敗しました</h2>
            </div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              再読み込み
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show message if no data available
  if (!reportData) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600">レポートデータがありません</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">予算レポート</h1>
            <p className="text-gray-600 mt-1">各部門・プロジェクト・イベントの予算使用状況を確認できます</p>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>概要</span>
            </TabsTrigger>
            <TabsTrigger value="departments" className="flex items-center space-x-2">
              <Building className="h-4 w-4" />
              <span>部門別</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>イベント別</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>プロジェクト別</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <Tag className="h-4 w-4" />
              <span>勘定科目別</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">総予算</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{totalBudget.toLocaleString()}</div>
                  <div className="flex items-center mt-2 text-sm opacity-90">
                    <DollarSign className="h-4 w-4 mr-1" />
                    全体予算
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">総使用額</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{totalExpenses.toLocaleString()}</div>
                  <div className="flex items-center mt-2 text-sm opacity-90">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {overallUsage.toFixed(1)}% 使用
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium opacity-90">総残額</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">¥{totalRemaining.toLocaleString()}</div>
                  <div className="flex items-center mt-2 text-sm opacity-90">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    残り予算
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">全体使用率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{overallUsage.toFixed(1)}%</div>
                  <Progress value={overallUsage} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </div>
            
            {/* Statistics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>ステータス別統計</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-green-600 font-semibold text-sm">健全</div>
                      <div className="text-2xl font-bold text-green-800">{healthyCount}</div>
                      <div className="text-xs text-green-600">項目</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="text-yellow-600 font-semibold text-sm">要注意</div>
                      <div className="text-2xl font-bold text-yellow-800">{warningCount}</div>
                      <div className="text-xs text-yellow-600">項目</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="text-red-600 font-semibold text-sm">危険</div>
                      <div className="text-2xl font-bold text-red-800">{dangerCount}</div>
                      <div className="text-xs text-red-600">項目</div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-gray-600">
                    全{totalItems}項目中
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>カテゴリ別統計</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Building className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                      <div className="text-blue-600 font-semibold text-sm">部門</div>
                      <div className="text-xl font-bold text-blue-800">{departments.length}</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <FolderOpen className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                      <div className="text-purple-600 font-semibold text-sm">プロジェクト</div>
                      <div className="text-xl font-bold text-purple-800">{projects.length}</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <Calendar className="h-6 w-6 text-indigo-600 mx-auto mb-1" />
                      <div className="text-indigo-600 font-semibold text-sm">イベント</div>
                      <div className="text-xl font-bold text-indigo-800">{events.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Top Items by Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span>注意が必要な項目</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...departments, ...projects, ...events]
                    .filter(item => item.status === 'danger' || item.status === 'warning')
                    .sort((a, b) => b.usage_percentage - a.usage_percentage)
                    .slice(0, 5)
                    .map(item => {
                      const Icon = departments.includes(item) ? Building : projects.includes(item) ? FolderOpen : Calendar;
                      return (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-600">¥{item.total_expenses.toLocaleString()} / ¥{item.budget.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-sm font-semibold">{item.usage_percentage.toFixed(1)}%</div>
                              <Progress value={item.usage_percentage} className="w-20 h-1" />
                            </div>
                            <Badge className={getStatusColor(item.status)}>
                              {item.status === 'warning' ? '要注意' : '危険'}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Departments Tab */}
          <TabsContent value="departments">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {departments.map(department => (
                <SummaryCard 
                  key={department.id} 
                  item={department} 
                  icon={Building} 
                  type="department" 
                />
              ))}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {events.map(event => (
                <SummaryCard 
                  key={event.id} 
                  item={event} 
                  icon={Calendar} 
                  type="event" 
                />
              ))}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map(project => (
                <SummaryCard 
                  key={project.id} 
                  item={project} 
                  icon={FolderOpen} 
                  type="project" 
                />
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {categories.map(category => (
                <CategoryCard 
                  key={category.id} 
                  item={category} 
                  icon={Tag} 
                  type="category" 
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sliding Detail Panel */}
      {detailPanelOpen && selectedItem && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={closeDetailPanel}
          />
          
          {/* Sliding Panel */}
          <div className="fixed inset-y-0 right-0 w-3/4 max-w-4xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto">
            {/* Panel Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const Icon = categories.some(c => c.id === selectedItem.id) ? Tag :
                              departments.some(d => d.id === selectedItem.id) ? Building :
                              projects.some(p => p.id === selectedItem.id) ? FolderOpen : Calendar;
                  return <Icon className="h-6 w-6 text-blue-600" />;
                })()}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedItem.name}</h2>
                  <p className="text-sm text-gray-500">詳細レポート</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={closeDetailPanel}
                className="hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Panel Content */}
            <div className="p-6 space-y-8">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-blue-600 font-semibold text-sm">予算</div>
                  <div className="text-2xl font-bold text-blue-800">¥{selectedItem.budget.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-orange-600 font-semibold text-sm">使用額</div>
                  <div className="text-2xl font-bold text-orange-800">¥{selectedItem.total_expenses.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-green-600 font-semibold text-sm">残額</div>
                  <div className="text-2xl font-bold text-green-800">¥{selectedItem.remaining.toLocaleString()}</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-600 font-semibold text-sm">使用率</div>
                  <div className="text-2xl font-bold text-gray-800">{selectedItem.usage_percentage.toFixed(1)}%</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>予算使用状況</span>
                  <span>{selectedItem.usage_percentage.toFixed(1)}%</span>
                </div>
                <Progress value={selectedItem.usage_percentage} className="h-3" />
              </div>

              {/* Analysis Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <span>勘定科目別支出</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const itemType = categories.some(c => c.id === selectedItem.id) ? 'category' :
                                        departments.some(d => d.id === selectedItem.id) ? 'department' : 
                                        projects.some(p => p.id === selectedItem.id) ? 'project' : 'event';
                        
                        if (itemType === 'category') {
                          const expenses = getExpensesForCategory(selectedItem.id);
                          const userTotals = expenses.reduce((acc, expense) => {
                            if (!acc[expense.user_name]) {
                              acc[expense.user_name] = { total: 0, count: 0 };
                            }
                            acc[expense.user_name].total += expense.amount;
                            acc[expense.user_name].count += 1;
                            return acc;
                          }, {} as Record<string, { total: number; count: number }>);

                          if (Object.keys(userTotals).length === 0) {
                            return <div className="text-center text-gray-500 py-4">経費データがありません</div>;
                          }

                          return Object.entries(userTotals)
                            .sort(([,a], [,b]) => b.total - a.total)
                            .map(([userName, data]) => {
                              const percentage = selectedItem.total_expenses > 0 ? (data.total / selectedItem.total_expenses) * 100 : 0;
                              return (
                                <div key={userName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                        {userName.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-sm">{userName}</div>
                                      <div className="text-xs text-gray-500">{data.count}件の申請</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">¥{data.total.toLocaleString()}</div>
                                    <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                                  </div>
                                </div>
                              );
                            });
                        } else {
                          const expenses = getExpensesForItem(selectedItem.id, itemType);
                          const categoryTotals = expenses.reduce((acc, expense) => {
                            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
                            return acc;
                          }, {} as Record<string, number>);
                          
                          if (Object.keys(categoryTotals).length === 0) {
                            return <div className="text-center text-gray-500 py-4">経費データがありません</div>;
                          }
                          
                          return Object.entries(categoryTotals)
                            .sort(([,a], [,b]) => b - a)
                            .map(([category, amount]) => {
                              const percentage = selectedItem.total_expenses > 0 ? (amount / selectedItem.total_expenses) * 100 : 0;
                              return (
                                <div key={category} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{category}</span>
                                    <div className="text-right">
                                      <div className="font-semibold">¥{amount.toLocaleString()}</div>
                                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                                    </div>
                                  </div>
                                  <Progress value={percentage} className="h-2" />
                                </div>
                              );
                            });
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>
                
                {/* User Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-green-600" />
                      <span>ユーザー別支出</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const itemType = categories.some(c => c.id === selectedItem.id) ? 'category' :
                                        departments.some(d => d.id === selectedItem.id) ? 'department' : 
                                        projects.some(p => p.id === selectedItem.id) ? 'project' : 'event';
                        
                        let expenses;
                        if (itemType === 'category') {
                          expenses = getExpensesForCategory(selectedItem.id);
                        } else {
                          expenses = getExpensesForItem(selectedItem.id, itemType);
                        }
                        
                        const userTotals = expenses.reduce((acc, expense) => {
                          if (!acc[expense.user_name]) {
                            acc[expense.user_name] = { total: 0, count: 0 };
                          }
                          acc[expense.user_name].total += expense.amount;
                          acc[expense.user_name].count += 1;
                          return acc;
                        }, {} as Record<string, { total: number; count: number }>);
                        
                        if (Object.keys(userTotals).length === 0) {
                          return <div className="text-center text-gray-500 py-4">経費データがありません</div>;
                        }
                        
                        return Object.entries(userTotals)
                          .sort(([,a], [,b]) => b.total - a.total)
                          .map(([userName, data]) => {
                            const percentage = selectedItem.total_expenses > 0 ? (data.total / selectedItem.total_expenses) * 100 : 0;
                            return (
                              <div key={userName} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                                      {userName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium text-sm">{userName}</div>
                                    <div className="text-xs text-gray-500">{data.count}件の申請</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold">¥{data.total.toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                                </div>
                              </div>
                            );
                          });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Monthly Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>月別支出推移</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-6 gap-4">
                    {(() => {
                      const currentDate = new Date();
                      const months = [];
                      const itemType = categories.some(c => c.id === selectedItem.id) ? 'category' :
                                      departments.some(d => d.id === selectedItem.id) ? 'department' : 
                                      projects.some(p => p.id === selectedItem.id) ? 'project' : 'event';
                      const monthlyAmounts = getMonthlyExpenses(selectedItem.id, itemType);
                      const maxAmount = Math.max(...monthlyAmounts, 1);
                      
                      // Generate month labels (last 6 months)
                      for (let i = 5; i >= 0; i--) {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                        months.push(`${date.getMonth() + 1}月`);
                      }
                      
                      return months.map((month, index) => {
                        const amount = monthlyAmounts[index];
                        const percentage = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                        return (
                          <div key={month} className="text-center">
                            <div className="text-xs text-gray-600 mb-2">{month}</div>
                            <div className="h-20 bg-gray-100 rounded relative flex items-end justify-center">
                              <div 
                                className="bg-purple-500 rounded w-full transition-all duration-300" 
                                style={{ height: `${Math.max(percentage, 5)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs font-medium mt-2">¥{amount.toLocaleString()}</div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Expenses List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <span>申請詳細一覧</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {(() => {
                      const itemType = categories.some(c => c.id === selectedItem.id) ? 'category' :
                                      departments.some(d => d.id === selectedItem.id) ? 'department' : 
                                      projects.some(p => p.id === selectedItem.id) ? 'project' : 'event';
                      
                      let expenses;
                      if (itemType === 'category') {
                        expenses = getExpensesForCategory(selectedItem.id);
                      } else {
                        expenses = getExpensesForItem(selectedItem.id, itemType);
                      }
                      
                      if (expenses.length === 0) {
                        return <div className="text-center text-gray-500 py-8">経費データがありません</div>;
                      }
                      
                      return expenses.map(expense => (
                        <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center space-x-4">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                {expense.user_name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{expense.user_name}</div>
                              <div className="text-sm text-gray-600">{expense.category} - {expense.description}</div>
                              <div className="text-xs text-gray-500">{expense.date}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-lg font-semibold">¥{expense.amount.toLocaleString()}</div>
                            </div>
                            <Badge className={
                              expense.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : expense.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }>
                              {expense.status === 'approved' ? '承認済み' : expense.status === 'pending' ? '承認待ち' : '却下'}
                            </Badge>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </MainLayout>
  );
}
