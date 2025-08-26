# 🤝 Guía de Contribución

## Para Desarrolladores de INAPA

Este es un proyecto interno de INAPA. Esta guía te ayudará a contribuir de manera efectiva.

## 📋 Antes de Comenzar

1. **Lee la documentación**: Revisa [docs/README.md](./docs/README.md)
2. **Configura el entorno**: Sigue [docs/setup/01-configuracion-inicial.md](./docs/setup/01-configuracion-inicial.md)
3. **Entiende la arquitectura**: Consulta [docs/development/documentacion-desarrollo.md](./docs/development/documentacion-desarrollo.md)

## 🏗️ Flujo de Desarrollo

### 1. Configuración Inicial
```bash
# Clonar el repositorio
git clone https://github.com/amirandap/inapa-event-attendance.git
cd inapa-event-attendance

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con las configuraciones necesarias

# Inicializar base de datos
npm run db:push
npm run db:seed
```

### 2. Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# Tests (cuando estén implementados)
npm run test

# Linting
npm run lint
```

### 3. Base de Datos
```bash
# Ver base de datos
npm run db:studio

# Resetear base de datos
npm run db:reset

# Aplicar cambios de esquema
npm run db:push
```

## 📁 Estructura del Proyecto

```
├── app/                 # Next.js App Router
├── components/          # Componentes React reutilizables
├── lib/                # Utilidades y servicios
├── prisma/             # Base de datos y migraciones
├── docs/               # Documentación organizada
├── scripts/            # Scripts de desarrollo
├── tests/              # Archivos de prueba
└── public/             # Archivos estáticos
```

## 🎯 Estándares de Código

### TypeScript
- Usar tipos estrictos
- Evitar `any`
- Documentar funciones públicas con JSDoc

### React/Next.js
- Componentes funcionales con hooks
- Usar Server Components cuando sea posible
- Implementar loading y error states

### Base de Datos
- Usar Prisma para todas las operaciones
- Escribir migraciones descriptivas
- Mantener integridad referencial

### Estilos
- Usar Tailwind CSS
- Seguir el design system de shadcn/ui
- Mantener consistencia con colores INAPA

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Servidor desarrollo
npm run build                  # Build producción
npm run start                  # Servidor producción

# Base de Datos
npm run db:studio             # Interfaz visual BD
npm run db:push               # Aplicar cambios sin migración
npm run db:reset              # Resetear BD completamente
npm run db:seed               # Ejecutar seeds

# Utilidades
npm run lint                  # ESLint
npm run kill:port             # Matar proceso en puerto 3000
```

## 📝 Commits

Usa mensajes descriptivos:
```bash
feat: añadir generación de reportes PDF
fix: corregir sincronización con Google Calendar
docs: actualizar guía de configuración
refactor: reorganizar estructura de componentes
```

## 🐛 Reportar Problemas

1. **Revisa TODO.md**: Verifica si el problema ya está listado
2. **Consulta la documentación**: Especialmente las guías de solución de problemas
3. **Describe el problema**: Incluye pasos para reproducir y logs de error
4. **Propón una solución**: Si tienes ideas de cómo solucionarlo

## 🔒 Seguridad

- **NO** commitear credenciales o claves privadas
- Usar variables de entorno para configuración sensible
- Seguir principios de least privilege para accesos a APIs

## 📞 Contacto

Para preguntas sobre el desarrollo:
- **Email**: minutas@inapa.gob.do
- **Departamento**: TI - INAPA

## 📚 Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

**Última actualización**: Agosto 2025
