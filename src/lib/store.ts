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