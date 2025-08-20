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
  status: 'planned' | 'active' | 'completed';
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
  getCategoriesByUsage: () => Promise<Category[]>;
  loadDataFromAPI: () => Promise<void>;
}

import { categoryService, projectService, departmentService, eventService } from './database';

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
  isLoaded: boolean;
  setEvents: (events: Event[]) => void;
  setLoaded: (loaded: boolean) => void;
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Event) => void;
  deleteEvent: (id: string) => void;
  getActiveEvents: () => Event[];
  getEventById: (id: string) => Event | undefined;
  loadEventsFromAPI: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>()((
  persist(
    (set, get) => ({
      expenses: [],
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
      events: [],
      isLoaded: false,
      setEvents: (events) => set({ events }),
      setLoaded: (loaded) => set({ isLoaded: loaded }),
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
      loadEventsFromAPI: async () => {
        try {
          const events = await eventService.getEvents();
          set({ 
            events, 
            isLoaded: true 
          });
        } catch (error) {
          console.error('Failed to load events from API:', error);
          // データベースから読み込み失敗時は空の状態を維持
          set({ 
            events: [],
            isLoaded: false
          });
        }
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
      getCategoriesByUsage: async () => {
        try {
          const response = await fetch('/api/reports-data');
          if (!response.ok) {
            throw new Error('Failed to fetch usage data');
          }
          const data = await response.json();
          const { categoryExpenses, categories } = data;
          
          // 使用回数をカウント（経費と請求書の両方から）
          const usageCount: Record<string, number> = {};
          data.expenses?.forEach((expense: any) => {
            if (expense.category_id) {
              usageCount[expense.category_id] = (usageCount[expense.category_id] || 0) + 1;
            }
          });
          data.invoicePayments?.forEach((invoice: any) => {
            if (invoice.category_id) {
              usageCount[invoice.category_id] = (usageCount[invoice.category_id] || 0) + 1;
            }
          });
          
          // 使用頻度順にソート
          const sortedCategories = (categories || get().categories).sort((a: Category, b: Category) => {
            const countA = usageCount[a.id] || 0;
            const countB = usageCount[b.id] || 0;
            return countB - countA; // 降順（使用頻度の高い順）
          });
          
          return sortedCategories;
        } catch (error) {
          console.error('Failed to get categories by usage:', error);
          // エラー時はデフォルトの順序で返す
          return get().categories;
        }
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
          // データベースから読み込み失敗時は空の状態を維持
          set({ 
            categories: [],
            projects: [],
            departments: [],
            isLoaded: false
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
