import { NextRequest, NextResponse } from 'next/server'
import { adminCleanupService } from '@/lib/database-admin'

// 管理者権限でのデータクリーンアップAPI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { protectedUserEmail } = body

    // 管理者権限の確認（実際の実装では認証チェックを追加）
    // TODO: 管理者認証の実装

    const result = await adminCleanupService.cleanupAllData(protectedUserEmail)

    return NextResponse.json({
      success: true,
      message: 'データクリーンアップが完了しました',
      result
    })
  } catch (error) {
    console.error('Admin cleanup error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'クリーンアップに失敗しました' 
      }, 
      { status: 500 }
    )
  }
}

// 管理者権限での全データ取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataType = searchParams.get('type')

    // 管理者権限の確認（実際の実装では認証チェックを追加）
    // TODO: 管理者認証の実装

    switch (dataType) {
      case 'users':
        const { adminUserService } = await import('@/lib/database-admin')
        const users = await adminUserService.getAllUsers()
        return NextResponse.json(users)

      case 'departments':
        const { adminDepartmentService } = await import('@/lib/database-admin')
        const departments = await adminDepartmentService.getAllDepartments()
        return NextResponse.json(departments)

      case 'expenses':
        const { adminExpenseService } = await import('@/lib/database-admin')
        const expenses = await adminExpenseService.getAllExpenses()
        return NextResponse.json(expenses)

      case 'invoice_payments':
        const { adminInvoicePaymentService } = await import('@/lib/database-admin')
        const invoicePayments = await adminInvoicePaymentService.getAllInvoicePayments()
        return NextResponse.json(invoicePayments)

      default:
        return NextResponse.json(
          { error: 'Invalid data type specified' }, 
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Admin data fetch error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'データ取得に失敗しました' 
      }, 
      { status: 500 }
    )
  }
}
