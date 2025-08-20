'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  CalendarDays, 
  Users, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Home
} from 'lucide-react'

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: Home },
  { name: 'Eventos', href: '/dashboard/eventos', icon: CalendarDays },
  { name: 'Asistencias', href: '/dashboard/asistencias', icon: Users },
  { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  { name: 'Ayuda', href: '/dashboard/ayuda', icon: HelpCircle },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 py-6 border-b">
        <div className="w-10 h-10 bg-inapa-primary rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-lg">INAPA</span>
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-bold text-inapa-primary">INAPA</h2>
          <p className="text-sm text-gray-600">Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-inapa-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-center">
        <p className="text-xs text-gray-500">
          v1.0.0 - Sistema de Asistencias
        </p>
      </div>
    </div>
  )
}
