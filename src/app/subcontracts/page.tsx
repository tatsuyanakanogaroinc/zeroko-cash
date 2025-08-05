'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Plus, 
  Building, 
  Calendar, 
  FolderOpen, 
  User, 
  Edit, 
  Trash2, 
  Search,
  FileText,
  DollarSign,
  Clock,
  Tag,
  Repeat
} from 'lucide-react';
import { 
  calculatePaymentCount, 
  calculateTotalAmount, 
  getFrequencyDisplayName,
  getRecurringPaymentDescription,
  type RecurringFrequency 
} from '@/lib/recurring-payment-utils';

interface Subcontract {
  id: string;
  contractor_name: string;
  contract_title: string;
  description: string;
  contract_amount: number;
  start_date: string;
  end_date: string;
  payment_date: string | null;
  status: 'active' | 'completed' | 'cancelled' | 'pending_payment';
  payment_type: 'one_time' | 'recurring';
  recurring_frequency?: RecurringFrequency | null;
  recurring_day?: number | null;
  payment_count?: number | null;
  total_amount: number;
  departments?: { id: string; name: string } | null;
  projects?: { id: string; name: string } | null;
  events?: { id: string; name: string } | null;
  categories?: { id: string; name: string } | null;
  users: { id: string; name: string; email: string };
  created_at: string;
}

interface FormData {
  contractor_name: string;
  contract_title: string;
  description: string;
  contract_amount: string;
  start_date: string;
  end_date: string;
  payment_date: string;
  department_id: string;
  project_id: string;
  event_id: string;
  category_id: string;
  responsible_user_id: string;
  status: string;
  payment_type: 'one_time' | 'recurring';
  recurring_frequency: string;
  recurring_day: string;
  payment_count: string;
  total_amount: string;
}

interface Department {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export default function SubcontractsPage() {
  const [subcontracts, setSubcontracts] = useState<Subcontract[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSubcontract, setEditingSubcontract] = useState<Subcontract | null>(null);
  const [formData, setFormData] = useState<FormData>({
    contractor_name: '',
    contract_title: '',
    description: '',
    contract_amount: '',
    start_date: '',
    end_date: '',
    payment_date: '',
    department_id: 'none',
    project_id: 'none',
    event_id: 'none',
    category_id: 'none',
    responsible_user_id: '',
    status: 'active',
    payment_type: 'one_time',
    recurring_frequency: 'monthly',
    recurring_day: '25',
    payment_count: '',
    total_amount: ''
  });

  useEffect(() => {
    fetchSubcontracts();
    fetchMasterData();
  }, []);

  // 定期支払いの自動計算
  useEffect(() => {
    if (formData.payment_type === 'recurring' && formData.start_date && formData.end_date && formData.contract_amount) {
      const paymentCount = calculatePaymentCount(
        formData.start_date,
        formData.end_date,
        formData.recurring_frequency as RecurringFrequency
      );
      const totalAmount = calculateTotalAmount(parseInt(formData.contract_amount), paymentCount);
      
      setFormData(prev => ({
        ...prev,
        payment_count: paymentCount.toString(),
        total_amount: totalAmount.toString()
      }));
    } else if (formData.payment_type === 'one_time' && formData.contract_amount) {
      setFormData(prev => ({
        ...prev,
        payment_count: '1',
        total_amount: formData.contract_amount
      }));
    }
  }, [formData.payment_type, formData.start_date, formData.end_date, formData.contract_amount, formData.recurring_frequency]);

  const fetchSubcontracts = async () => {
    try {
      const response = await fetch('/api/subcontracts');
      if (response.ok) {
        const data = await response.json();
        setSubcontracts(data);
      }
    } catch (error) {
      console.error('Error fetching subcontracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [deptRes, projRes, eventRes, catRes, userRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/projects'),
        fetch('/api/events'),
        fetch('/api/categories'),
        fetch('/api/users')
      ]);

      if (deptRes.ok) setDepartments(await deptRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (eventRes.ok) setEvents(await eventRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (userRes.ok) setUsers(await userRes.json());
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSubcontract ? '/api/subcontracts' : '/api/subcontracts';
      const method = editingSubcontract ? 'PUT' : 'POST';
      
      // "none"値をnullに変換
      const processedFormData = {
        ...formData,
        department_id: formData.department_id === 'none' ? '' : formData.department_id,
        project_id: formData.project_id === 'none' ? '' : formData.project_id,
        event_id: formData.event_id === 'none' ? '' : formData.event_id,
        category_id: formData.category_id === 'none' ? '' : formData.category_id,
      };
      
      const body = editingSubcontract 
        ? { ...processedFormData, id: editingSubcontract.id }
        : processedFormData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchSubcontracts();
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('この外注を削除しますか？')) return;

    try {
      const response = await fetch(`/api/subcontracts?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchSubcontracts();
      }
    } catch (error) {
      console.error('Error deleting subcontract:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      contractor_name: '',
      contract_title: '',
      description: '',
      contract_amount: '',
      start_date: '',
      end_date: '',
      payment_date: '',
      department_id: 'none',
      project_id: 'none',
      event_id: 'none',
      category_id: 'none',
      responsible_user_id: '',
      status: 'active',
      payment_type: 'one_time',
      recurring_frequency: 'monthly',
      recurring_day: '25',
      payment_count: '',
      total_amount: ''
    });
    setEditingSubcontract(null);
    setIsCreateModalOpen(false);
  };

  const openEditModal = (subcontract: Subcontract) => {
    setFormData({
      contractor_name: subcontract.contractor_name,
      contract_title: subcontract.contract_title,
      description: subcontract.description || '',
      contract_amount: subcontract.contract_amount.toString(),
      start_date: subcontract.start_date,
      end_date: subcontract.end_date,
      payment_date: subcontract.payment_date || '',
      department_id: subcontract.departments?.id || 'none',
      project_id: subcontract.projects?.id || 'none',
      event_id: subcontract.events?.id || 'none',
      category_id: subcontract.categories?.id || 'none',
      responsible_user_id: subcontract.users.id,
      status: subcontract.status,
      payment_type: subcontract.payment_type,
      recurring_frequency: subcontract.recurring_frequency || 'monthly',
      recurring_day: subcontract.recurring_day?.toString() || '25',
      payment_count: subcontract.payment_count?.toString() || '',
      total_amount: subcontract.total_amount.toString()
    });
    setEditingSubcontract(subcontract);
    setIsCreateModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '進行中';
      case 'completed': return '完了';
      case 'cancelled': return 'キャンセル';
      case 'pending_payment': return '支払い待ち';
      default: return status;
    }
  };

  const filteredSubcontracts = subcontracts.filter(subcontract => {
    const matchesSearch = 
      subcontract.contractor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subcontract.contract_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || subcontract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredSubcontracts.reduce((sum, sc) => sum + (sc.total_amount || sc.contract_amount), 0);
  const activeCount = subcontracts.filter(sc => sc.status === 'active').length;
  const completedCount = subcontracts.filter(sc => sc.status === 'completed').length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            <h1 className="text-3xl font-bold">外注管理</h1>
            <p className="text-gray-600 mt-1">外注の登録・管理・支払い状況を確認できます</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                新規外注登録
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSubcontract ? '外注編集' : '新規外注登録'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contractor_name">外注先名 *</Label>
                    <Input
                      id="contractor_name"
                      value={formData.contractor_name}
                      onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="contract_title">契約タイトル *</Label>
                    <Input
                      id="contract_title"
                      value={formData.contract_title}
                      onChange={(e) => setFormData({ ...formData, contract_title: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contract_amount">契約金額 *</Label>
                    <Input
                      id="contract_amount"
                      type="number"
                      value={formData.contract_amount}
                      onChange={(e) => setFormData({ ...formData, contract_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="start_date">開始日 *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">終了日 *</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="payment_date">支払い予定日</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department_id">部門</Label>
                    <Select
                      value={formData.department_id}
                      onValueChange={(value) => setFormData({ ...formData, department_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="部門を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">選択しない</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="project_id">プロジェクト</Label>
                    <Select
                      value={formData.project_id}
                      onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="プロジェクトを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">選択しない</SelectItem>
                        {projects.map(project => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="event_id">イベント</Label>
                    <Select
                      value={formData.event_id}
                      onValueChange={(value) => setFormData({ ...formData, event_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="イベントを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">選択しない</SelectItem>
                        {events.map(event => (
                          <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category_id">勘定科目</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="勘定科目を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">選択しない</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="responsible_user_id">担当者 *</Label>
                    <Select
                      value={formData.responsible_user_id}
                      onValueChange={(value) => setFormData({ ...formData, responsible_user_id: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="担当者を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">ステータス</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">進行中</SelectItem>
                        <SelectItem value="completed">完了</SelectItem>
                        <SelectItem value="cancelled">キャンセル</SelectItem>
                        <SelectItem value="pending_payment">支払い待ち</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    キャンセル
                  </Button>
                  <Button type="submit">
                    {editingSubcontract ? '更新' : '登録'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総外注数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subcontracts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">進行中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">完了</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">総契約金額</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="外注先名・契約名で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全てのステータス</SelectItem>
              <SelectItem value="active">進行中</SelectItem>
              <SelectItem value="completed">完了</SelectItem>
              <SelectItem value="cancelled">キャンセル</SelectItem>
              <SelectItem value="pending_payment">支払い待ち</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subcontracts List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubcontracts.map(subcontract => (
            <Card key={subcontract.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{subcontract.contract_title}</CardTitle>
                    <p className="text-sm text-gray-600">{subcontract.contractor_name}</p>
                  </div>
                  <Badge className={getStatusColor(subcontract.status)}>
                    {getStatusText(subcontract.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {subcontract.description && (
                  <p className="text-sm text-gray-700">{subcontract.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span>¥{subcontract.contract_amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-600" />
                    <span>{subcontract.users.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{subcontract.start_date} 〜 {subcontract.end_date}</span>
                  </div>
                  {subcontract.payment_date && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span>支払い: {subcontract.payment_date}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {subcontract.departments && (
                    <Badge variant="outline" className="text-xs">
                      <Building className="h-3 w-3 mr-1" />
                      {subcontract.departments.name}
                    </Badge>
                  )}
                  {subcontract.projects && (
                    <Badge variant="outline" className="text-xs">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {subcontract.projects.name}
                    </Badge>
                  )}
                  {subcontract.events && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {subcontract.events.name}
                    </Badge>
                  )}
                  {subcontract.categories && (
                    <Badge variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {subcontract.categories.name}
                    </Badge>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(subcontract)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(subcontract.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    削除
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredSubcontracts.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>外注データがありません</p>
                {searchTerm && <p className="text-sm mt-1">検索条件を変更してみてください</p>}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}