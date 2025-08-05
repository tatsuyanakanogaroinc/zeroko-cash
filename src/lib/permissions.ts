// 役割ベースの権限制御システム

export type UserRole = 'admin' | 'manager' | 'user' | 'contractor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department_id?: string
}

// 権限チェック関数
export const permissions = {
  // === 管理者専用機能 ===
  canManageUsers: (role: UserRole): boolean => {
    return role === 'admin'
  },

  canManageDepartments: (role: UserRole): boolean => {
    return role === 'admin'
  },

  canManageCategories: (role: UserRole): boolean => {
    return role === 'admin'  
  },

  canManageProjects: (role: UserRole): boolean => {
    return role === 'admin'
  },

  canManageEvents: (role: UserRole): boolean => {
    return role === 'admin'
  },

  canAccessMasterSettings: (role: UserRole): boolean => {
    return role === 'admin'
  },

  // === 管理者・マネージャー共通機能 ===
  canViewAllExpenses: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager'
  },

  canApproveExpenses: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager'
  },

  canViewAllInvoicePayments: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager'
  },

  canApproveInvoicePayments: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager'
  },

  canAccessApprovalManagement: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager'
  },

  // === 全ユーザー共通機能 ===
  canCreateExpenses: (role: UserRole): boolean => {
    return true // 全ユーザーが経費申請可能
  },

  canViewOwnExpenses: (role: UserRole): boolean => {
    return true // 全ユーザーが自分の経費を閲覧可能
  },

  canAccessReports: (role: UserRole): boolean => {
    return role !== 'contractor' // 業務委託以外がレポートにアクセス可能
  },

  canViewAllReportsData: (role: UserRole): boolean => {
    return role !== 'contractor' // 業務委託以外がレポートでは全データを閲覧可能
  },

  // === 請求書払い申請機能 ===
  canCreateInvoicePayments: (role: UserRole): boolean => {
    return true // 全ユーザーが請求書払い申請可能
  },

  canViewOwnInvoicePayments: (role: UserRole): boolean => {
    return true // 全ユーザーが自分の請求書払い申請を閲覧可能
  },

  canAccessDashboard: (role: UserRole): boolean => {
    return true // 全ユーザーがダッシュボードにアクセス可能
  },

  canUpdateOwnProfile: (role: UserRole): boolean => {
    return true // 全ユーザーが自分のプロフィールを更新可能
  },

  // === 外注管理機能 ===
  canCreateSubcontracts: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager' // 管理者・マネージャーが外注作成可能
  },

  canViewAllSubcontracts: (role: UserRole): boolean => {
    return role !== 'contractor' // 業務委託以外が外注一覧を閲覧可能
  },

  canEditSubcontracts: (role: UserRole): boolean => {
    return role === 'admin' || role === 'manager' // 管理者・マネージャーが外注編集可能
  },

  canDeleteSubcontracts: (role: UserRole): boolean => {
    return role === 'admin' // 管理者のみ外注削除可能
  },

  // === ユーザー特定の権限 ===
  canEditOwnPendingExpenses: (role: UserRole): boolean => {
    return true // 全ユーザーが自分のpending状態の経費を編集可能
  }
}

// ナビゲーション表示制御
export const navigationPermissions = {
  shouldShowDashboard: (role: UserRole): boolean => true,
  shouldShowExpenses: (role: UserRole): boolean => true,
  shouldShowInvoicePayments: (role: UserRole): boolean => true,
  shouldShowReports: (role: UserRole): boolean => role !== 'contractor', // 業務委託以外がレポートを閲覧可能
  shouldShowSubcontracts: (role: UserRole): boolean => role !== 'contractor', // 業務委託以外が外注一覧を閲覧可能
  
  // 管理者・マネージャーのみ表示
  shouldShowApprovals: (role: UserRole): boolean => 
    role === 'admin' || role === 'manager',
  
  // 管理者のみ表示
  shouldShowUserManagement: (role: UserRole): boolean => 
    role === 'admin',
    
  shouldShowMasterSettings: (role: UserRole): boolean => 
    role === 'admin'
}

// 権限チェックヘルパー
export function hasPermission(
  user: User | null, 
  permission: keyof typeof permissions
): boolean {
  if (!user) return false
  return permissions[permission](user.role)
}

// ナビゲーション表示チェックヘルパー
export function shouldShowNavItem(
  user: User | null,
  navItem: keyof typeof navigationPermissions
): boolean {
  if (!user) return false
  return navigationPermissions[navItem](user.role)
}

// 役割表示名の変換
export const roleDisplayNames: Record<UserRole, string> = {
  admin: '管理者',
  manager: 'マネージャー',
  user: '一般ユーザー',
  contractor: '業務委託'
}

export function getRoleDisplayName(role: UserRole): string {
  return roleDisplayNames[role] || role
}

// デバッグ用権限一覧表示
export function getUserPermissions(role: UserRole): Record<string, boolean> {
  const userPermissions: Record<string, boolean> = {}
  
  Object.keys(permissions).forEach(key => {
    const permissionKey = key as keyof typeof permissions
    userPermissions[key] = permissions[permissionKey](role)
  })
  
  return userPermissions
}
