'use client'

import { useState } from 'react'
import { Search, Mail, User, Filter } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InviteeType } from '@/lib/types'

interface InviteesTableProps {
  invitees: InviteeType[]
  checkedInEmails: Set<string>
}

export function InviteesTable({ invitees, checkedInEmails }: InviteesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [responseFilter, setResponseFilter] = useState<string>('all')

  const filteredInvitees = invitees.filter(invitee => {
    const matchesSearch = 
      invitee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invitee.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesResponse = responseFilter === 'all' || invitee.response === responseFilter
    
    return matchesSearch && matchesResponse
  })

  const getResponseBadge = (response: string | null, hasCheckedIn: boolean) => {
    if (hasCheckedIn) {
      return <Badge className="bg-green-100 text-green-800">Registrado</Badge>
    }

    switch (response) {
      case 'accepted':
        return <Badge className="bg-blue-100 text-blue-800">Confirmado</Badge>
      case 'declined':
        return <Badge className="bg-red-100 text-red-800">Declinó</Badge>
      case 'tentative':
        return <Badge className="bg-yellow-100 text-yellow-800">Tentativo</Badge>
      default:
        return <Badge variant="outline">Sin respuesta</Badge>
    }
  }

  const stats = {
    total: invitees.length,
    accepted: invitees.filter(i => i.response === 'accepted').length,
    declined: invitees.filter(i => i.response === 'declined').length,
    tentative: invitees.filter(i => i.response === 'tentative').length,
    noResponse: invitees.filter(i => !i.response || i.response === 'needsAction').length,
    checkedIn: invitees.filter(i => checkedInEmails.has(i.email)).length
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{stats.checkedIn}</div>
          <div className="text-sm text-gray-600">Registrados</div>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{stats.accepted}</div>
          <div className="text-sm text-gray-600">Confirmados</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">{stats.declined}</div>
          <div className="text-sm text-gray-600">Declinaron</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">{stats.tentative}</div>
          <div className="text-sm text-gray-600">Tentativos</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-600">{stats.noResponse}</div>
          <div className="text-sm text-gray-600">Sin respuesta</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={responseFilter} onValueChange={setResponseFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por respuesta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las respuestas</SelectItem>
            <SelectItem value="accepted">Confirmados</SelectItem>
            <SelectItem value="declined">Declinaron</SelectItem>
            <SelectItem value="tentative">Tentativos</SelectItem>
            <SelectItem value="needsAction">Sin respuesta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invitado</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Respuesta</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvitees.map((invitee) => {
              const hasCheckedIn = checkedInEmails.has(invitee.email)
              return (
                <TableRow key={invitee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {invitee.name || 'Sin nombre'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{invitee.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getResponseBadge(invitee.response || null, hasCheckedIn)}
                  </TableCell>
                  <TableCell>
                    {hasCheckedIn ? (
                      <Badge className="bg-green-100 text-green-800">
                        ✓ Asistió
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        No registrado
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>

        {filteredInvitees.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No se encontraron invitados que coincidan con los filtros
          </div>
        )}
      </div>
    </div>
  )
}
