# 📚 Documentación - INAPA Event Attendance

Sistema de gestión de asistencia a eventos de INAPA con integración a Google Calendar.

## 🚀 Inicio Rápido

### Configuración Inicial
- [01. Configuración Inicial](./setup/01-configuracion-inicial.md)
- [02. Base de Datos Prisma](./setup/02-base-datos-prisma.md)
- [03. Integración Google Calendar](./setup/03-integracion-google.md)
- [08. OAuth Google](./setup/08-oauth-google.md)

## 🛠️ Desarrollo

### Documentación Técnica
- [Documentación de Desarrollo](./development/documentacion-desarrollo.md)
- [04. UI y Componentes](./development/04-ui-componentes.md)
- [06. Generación de Reportes y Jobs](./development/06-generacion-reportes-jobs.md)
- [07. Mejoras de Sincronización](./development/07-mejoras-sincronizacion.md)

## 🔌 API

### Documentación de APIs
- [Documentación de API](./api/api-documentation.md)
- [05. APIs y Endpoints](./api/05-apis-endpoints.md)

## 📖 Guías y Soluciones

### Guías Especializadas
- [Workarounds Google Workspace](./guides/workarounds-google-workspace.md)
- [Fallback iCal](./guides/fallback-ical.md)
- [Migración Blockchain](./guides/migracion-blockchain.md)

## 🗂️ Estructura del Proyecto

```
docs/
├── README.md                    # Este archivo - índice principal
├── setup/                       # Configuración inicial del proyecto
│   ├── 01-configuracion-inicial.md
│   ├── 02-base-datos-prisma.md
│   ├── 03-integracion-google.md
│   └── 08-oauth-google.md
├── development/                 # Documentación para desarrolladores
│   ├── documentacion-desarrollo.md
│   ├── 04-ui-componentes.md
│   ├── 06-generacion-reportes-jobs.md
│   └── 07-mejoras-sincronizacion.md
├── api/                        # Documentación de APIs
│   ├── api-documentation.md
│   └── 05-apis-endpoints.md
├── guides/                     # Guías y soluciones específicas
│   ├── workarounds-google-workspace.md
│   ├── fallback-ical.md
│   └── migracion-blockchain.md
└── backups/                    # Archivos de respaldo
    ├── DOCUMENTACION_DESARROLLO_backup.md
    └── MIGRACION_BLOCKCHAIN_backup.md
```

## 🎯 Flujo de Trabajo Recomendado

1. **Para nuevos desarrolladores**: Comienza con la sección [Configuración Inicial](#configuración-inicial)
2. **Para desarrollo**: Consulta la [Documentación de Desarrollo](./development/documentacion-desarrollo.md)
3. **Para integración de APIs**: Revisa la [Documentación de API](./api/api-documentation.md)
4. **Para problemas específicos**: Busca en [Guías y Soluciones](#guías-y-soluciones)

## 🔧 Tecnologías Principales

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQLite (desarrollo) / PostgreSQL (producción)
- **Integraciones**: Google Calendar API, Google Workspace
- **Autenticación**: Service Account + OAuth 2.0

## 📞 Soporte

Para preguntas o problemas, consulta primero las guías existentes. Si no encuentras la solución, revisa el archivo [TODO.MD](../TODO.MD) para ver tareas pendientes o crear una nueva issue.

---

**Última actualización**: $(date)
**Versión del proyecto**: 0.1.0
