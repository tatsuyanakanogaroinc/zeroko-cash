'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useMasterDataStore } from '@/lib/store';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Building, 
  Calendar, 
  FolderOpen,
  Eye,
  BarChart3
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

export default function ReportsPage() {
  const { departments: deptData, projects: projectData } = useMasterDataStore();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Calculate usage percentage and status
  const calculateSummary = (budget: number, expenses: number): { usage_percentage: number; status: 'healthy' | 'warning' | 'danger' } => {
    const usage = budget > 0 ? (expenses / budget) * 100 : 0;
    let status: 'healthy' | 'warning' | 'danger' = 'healthy';
    if (usage >= 90) status = 'danger';
    else if (usage >= 70) status = 'warning';
    return { usage_percentage: usage, status };
  };

  // Convert Zustand store data to Summary format
  const departments: Summary[] = deptData.map(d => {
    const expenses = Math.floor(Math.random() * d.budget * 0.8); // Mock expenses
    const summary = calculateSummary(d.budget || 0, expenses);
    return {
      id: d.id,
      name: d.name,
      budget: d.budget || 0,
      total_expenses: expenses,
      remaining: (d.budget || 0) - expenses,
      ...summary
    };
  });

  const projects: Summary[] = projectData.map(p => {
    const expenses = Math.floor(Math.random() * p.budget * 0.6); // Mock expenses
    const summary = calculateSummary(p.budget || 0, expenses);
    return {
      id: p.id,
      name: p.name,
      budget: p.budget || 0,
      total_expenses: expenses,
      remaining: (p.budget || 0) - expenses,
      ...summary
    };
  });

  // Mock events data with realistic expenses
  const events: Summary[] = [
    {
      id: '1',
      name: '東京展示会2024',
      budget: 50000,
      total_expenses: 35000,
      remaining: 15000,
      usage_percentage: 70,
      status: 'warning'
    },
    {
      id: '2',
      name: '大阪商談会',
      budget: 30000,
      total_expenses: 12000,
      remaining: 18000,
      usage_percentage: 40,
      status: 'healthy'
    },
    {
      id: '3',
      name: '名古屋セミナー',
      budget: 15000,
      total_expenses: 14500,
      remaining: 500,
      usage_percentage: 97,
      status: 'danger'
    }
  ];

  // Calculate totals for overview
  const totalBudget = [...departments, ...projects, ...events].reduce((sum, item) => sum + item.budget, 0);
  const totalExpenses = [...departments, ...projects, ...events].reduce((sum, item) => sum + item.total_expenses, 0);
  const totalRemaining = totalBudget - totalExpenses;
  const overallUsage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

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
          <Button variant="outline" size="sm" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            詳細を見る
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
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
        </Tabs>
      </div>
    </MainLayout>
  );
}
