import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Category {
  id: string;
  name: string;
  description?: string;
  requires_receipt: boolean;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  department_id: string;
  budget: number;
  status: 'active' | 'completed' | 'suspended';
  created_at: string;
}

interface Department {
  id: string;
  name: string;
  manager_id: string;
  budget: number;
  created_at: string;
}

interface Expense {
  id: string;
  date: string;
  amount: number;
  category_id: string;
  department_id?: string;
  project_id?: string;
  event_id?: string;
  user_name: string;
  description: string;
  status: 'approved' | 'pending' | 'rejected';
  receipt_url?: string;
  created_at: string;
  updated_at: string;
}

interface Event {
  id: string;
  name: string;
  budget: number;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

interface MasterDataState {
  categories: Category[];
  projects: Project[];
  departments: Department[];
  isLoaded: boolean;
  setCategories: (categories: Category[]) => void;
  setProjects: (projects: Project[]) => void;
  setDepartments: (departments: Department[]) => void;
  setLoaded: (loaded: boolean) => void;
  addCategory: (category: Category) => void;
  updateCategory: (id: string, category: Category) => void;
  deleteCategory: (id: string) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, project: Project) => void;
  deleteProject: (id: string) => void;
  addDepartment: (department: Department) => void;
  updateDepartment: (id: string, department: Department) => void;
  deleteDepartment: (id: string) => void;
  getActiveProjects: () => Project[];
  getCategoryById: (id: string) => Category | undefined;
  getProjectById: (id: string) => Project | undefined;
  loadDataFromAPI: () => Promise<void>;
}

import { categoryService, projectService, departmentService } from './database';

interface ExpenseState {
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Expense) => void;
  deleteExpense: (id: string) => void;
  getExpensesByDepartment: (departmentId: string) => Expense[];
  getExpensesByProject: (projectId: string) => Expense[];
  getExpensesByEvent: (eventId: string) => Expense[];
  getTotalExpensesByDepartment: (departmentId: string) => number;
  getTotalExpensesByProject: (projectId: string) => number;
  getTotalExpensesByEvent: (eventId: string) => number;
}

interface EventState {
  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Event) => void;
  deleteEvent: (id: string) => void;
  getActiveEvents: () => Event[];
  getEventById: (id: string) => Event | undefined;
}

export const useExpenseStore = create<ExpenseState>()((
  persist(
    (set, get) => ({
      expenses: [
        {
          id: '1',
          date: '2024-07-20',
          amount: 5000,
          category_id: '1',
          department_id: '1',
          user_name: '田中太郎',
          description: '営業先への交通費',
          status: 'approved',
          created_at: '2024-07-20',
          updated_at: '2024-07-20'
        },
        {
          id: '2',
          date: '2024-07-21',
          amount: 3000,
          category_id: '2',
          department_id: '1',
          user_name: '佐藤花子',
          description: 'クライアントとの会議費',
          status: 'approved',
          created_at: '2024-07-21',
          updated_at: '2024-07-21'
        },
        {
          id: '3',
          date: '2024-07-22',
          amount: 8000,
          category_id: '1',
          project_id: '1',
          user_name: '鈴木一郎',
          description: 'プロジェクトA関連の出張費',
          status: 'approved',
          created_at: '2024-07-22',
          updated_at: '2024-07-22'
        },
        {
          id: '4',
          date: '2024-07-23',
          amount: 12000,
          category_id: '2',
          event_id: '1',
          user_name: '高橋美咲',
          description: '東京展示会での会議費',
          status: 'approved',
          created_at: '2024-07-23',
          updated_at: '2024-07-23'
        },
        {
          id: '5',
          date: '2024-07-24',
          amount: 2500,
          category_id: '4',
          department_id: '2',
          user_name: '山田次郎',
          description: 'マーケティング用通信費',
          status: 'pending',
          created_at: '2024-07-24',
          updated_at: '2024-07-24'
        },
        {
          id: '6',
          date: '2024-07-25',
          amount: 15000,
          category_id: '1',
          event_id: '3',
          user_name: '田中太郎',
          description: '名古屋セミナー参加交通費',
          status: 'approved',
          created_at: '2024-07-25',
          updated_at: '2024-07-25'
        }
      ],
      addExpense: (expense) => set((state) => ({
        expenses: [...state.expenses, expense]
      })),
      updateExpense: (id, expense) => set((state) => ({
        expenses: state.expenses.map(exp => 
          exp.id === id ? expense : exp
        )
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: state.expenses.filter(exp => exp.id !== id)
      })),
      getExpensesByDepartment: (departmentId) => {
        const state = get();
        return state.expenses.filter(exp => exp.department_id === departmentId);
      },
      getExpensesByProject: (projectId) => {
        const state = get();
        return state.expenses.filter(exp => exp.project_id === projectId);
      },
      getExpensesByEvent: (eventId) => {
        const state = get();
        return state.expenses.filter(exp => exp.event_id === eventId);
      },
      getTotalExpensesByDepartment: (departmentId) => {
        const state = get();
        return state.expenses
          .filter(exp => exp.department_id === departmentId && exp.status === 'approved')
          .reduce((total, exp) => total + exp.amount, 0);
      },
      getTotalExpensesByProject: (projectId) => {
        const state = get();
        return state.expenses
          .filter(exp => exp.project_id === projectId && exp.status === 'approved')
          .reduce((total, exp) => total + exp.amount, 0);
      },
      getTotalExpensesByEvent: (eventId) => {
        const state = get();
        return state.expenses
          .filter(exp => exp.event_id === eventId && exp.status === 'approved')
          .reduce((total, exp) => total + exp.amount, 0);
      },
    }),
    {
      name: 'expense-storage',
    }
  )
));

export const useEventStore = create<EventState>()((
  persist(
    (set, get) => ({
      events: [
        {
          id: '1',
          name: '東京展示会2024',
          budget: 50000,
          description: '年次展示会への参加',
          start_date: '2024-07-15',
          end_date: '2024-07-17',
          status: 'active',
          created_at: '2024-06-01',
        },
        {
          id: '2',
          name: '大阪商談会',
          budget: 30000,
          description: '関西地区での商談会',
          start_date: '2024-08-20',
          end_date: '2024-08-22',
          status: 'planned',
          created_at: '2024-06-15',
        },
        {
          id: '3',
          name: '名古屋セミナー',
          budget: 15000,
          description: '技術セミナーの開催',
          start_date: '2024-09-10',
          end_date: '2024-09-10',
          status: 'active',
          created_at: '2024-07-01',
        }
      ],
      addEvent: (event) => set((state) => ({
        events: [...state.events, event]
      })),
      updateEvent: (id, event) => set((state) => ({
        events: state.events.map(evt => 
          evt.id === id ? event : evt
        )
      })),
      deleteEvent: (id) => set((state) => ({
        events: state.events.filter(evt => evt.id !== id)
      })),
      getActiveEvents: () => {
        const state = get();
        return state.events.filter(evt => evt.status === 'active' || evt.status === 'planned');
      },
      getEventById: (id) => {
        const state = get();
        return state.events.find(evt => evt.id === id);
      },
    }),
    {
      name: 'event-storage',
    }
  )
));

export const useMasterDataStore = create<MasterDataState>()(
  persist(
    (set, get) => ({
      categories: [],
      projects: [],
      departments: [],
      isLoaded: false,
      setCategories: (categories) => set({ categories }),
      setProjects: (projects) => set({ projects }),
      setDepartments: (departments) => set({ departments }),
      setLoaded: (loaded) => set({ isLoaded: loaded }),
      addCategory: (category) => set((state) => ({
        categories: [...state.categories, category]
      })),
      updateCategory: (id, category) => set((state) => ({
        categories: state.categories.map(cat => 
          cat.id === id ? category : cat
        )
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter(cat => cat.id !== id)
      })),
      addProject: (project) => set((state) => ({
        projects: [...state.projects, project]
      })),
      updateProject: (id, project) => set((state) => ({
        projects: state.projects.map(proj => 
          proj.id === id ? project : proj
        )
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(proj => proj.id !== id)
      })),
      addDepartment: (department) => set((state) => ({
        departments: [...state.departments, department]
      })),
      updateDepartment: (id, department) => set((state) => ({
        departments: state.departments.map(dept => 
          dept.id === id ? department : dept
        )
      })),
      deleteDepartment: (id) => set((state) => ({
        departments: state.departments.filter(dept => dept.id !== id)
      })),
      getActiveProjects: () => {
        const state = get();
        return state.projects.filter(proj => proj.status === 'active');
      },
      getCategoryById: (id) => {
        const state = get();
        return state.categories.find(cat => cat.id === id);
      },
      getProjectById: (id) => {
        const state = get();
        return state.projects.find(proj => proj.id === id);
      },
      loadDataFromAPI: async () => {
        try {
          const [categories, projects, departments] = await Promise.all([
            categoryService.getCategories(),
            projectService.getProjects(),
            departmentService.getDepartments(),
          ]);
          
          set({ 
            categories, 
            projects, 
            departments, 
            isLoaded: true 
          });
        } catch (error) {
          console.error('Failed to load master data from API:', error);
          // フォールバック: デフォルトデータを使用
          set({ 
            categories: [
              {
                id: '1',
                name: '交通費',
                description: '電車、バス、タクシーなどの交通費',
                requires_receipt: true,
                created_at: '2024-01-01',
              },
              {
                id: '2',
                name: '会議費',
                description: '会議室代、飲食費など',
                requires_receipt: true,
                created_at: '2024-01-01',
              },
              {
                id: '3',
                name: '書籍代',
                description: '業務関連の書籍購入費',
                requires_receipt: false,
                created_at: '2024-01-01',
              },
              {
                id: '4',
                name: '通信費',
                description: '電話代、インターネット代など',
                requires_receipt: true,
                created_at: '2024-01-01',
              },
            ],
            projects: [
              {
                id: '1',
                name: 'プロジェクトA',
                code: 'PRJ-A',
                department_id: '1',
                budget: 200000,
                status: 'active',
                created_at: '2024-01-01',
              },
              {
                id: '2',
                name: 'プロジェクトB',
                code: 'PRJ-B',
                department_id: '1',
                budget: 300000,
                status: 'active',
                created_at: '2024-01-01',
              },
            ],
            departments: [
              {
                id: '1',
                name: 'セールス',
                manager_id: '1',
                budget: 1000000,
                created_at: '2024-01-01',
              },
              {
                id: '2',
                name: 'マーケティング',
                manager_id: '2',
                budget: 800000,
                created_at: '2024-01-01',
              },
            ],
            isLoaded: true 
          });
        }
      },
    }),
    {
      name: 'master-data-storage',
    }
  )
); 

// Export types for use in other files
export type { Category, Project, Department, Expense, Event };
