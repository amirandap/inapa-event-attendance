# 🧪 Tests Directory

Este directorio contiene archivos de prueba y scripts de testing del proyecto.

## 📁 Estructura

```
tests/
├── README.md                 # Este archivo
├── test-calendar.js          # Pruebas de Google Calendar API
├── test-db.ts               # Pruebas de base de datos
└── test-ical-fallback.js    # Pruebas de fallback iCal
```

## 🚀 Ejecutar Pruebas

### Prueba de Google Calendar
```bash
cd tests
node test-calendar.js
```

### Prueba de Base de Datos
```bash
cd tests
npx tsx test-db.ts
```

### Prueba de Fallback iCal
```bash
cd tests
node test-ical-fallback.js
```

## 📝 Notas

- Estos son scripts de prueba durante desarrollo
- Para tests automatizados de producción, usar frameworks como Jest
- Asegúrate de tener las variables de entorno configuradas

## 🔜 TODO

- [ ] Migrar a Jest para testing automatizado
- [ ] Añadir tests unitarios para componentes
- [ ] Implementar tests de integración
- [ ] Configurar CI/CD con tests automáticos
