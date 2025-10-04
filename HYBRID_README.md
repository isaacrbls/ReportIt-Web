# ReportIt-Web Hybrid System

This project implements a **hybrid architecture** that combines **Firebase** (primary) with **Django** (secondary) backend systems, while maintaining a **Node.js frontend** with React/Next.js.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js       │    │   Node.js API    │    │   Django        │
│   Frontend      │────│   Routes         │────│   Backend       │
│                 │    │   (pages/api)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                         ┌───────▼────────┐
                         │   Firebase     │
                         │   (Primary)    │
                         └────────────────┘
```

## Key Features

### ✅ Dual Data Storage
- **Firebase Firestore**: Primary real-time database
- **Django + SQLite/PostgreSQL**: Secondary relational database
- **Automatic sync**: Reports saved to both systems

### ✅ Hybrid Authentication
- **Firebase Auth**: Primary user authentication
- **Django JWT**: Optional secondary authentication
- **Seamless integration**: Frontend works with both

### ✅ Node.js API Layer
- **Enhanced reCAPTCHA**: Verifies with both systems
- **Password reset**: Falls back to Node.js if Django unavailable
- **Analytics proxy**: Routes to Django backend
- **Report sync**: Bidirectional data synchronization

### ✅ Maintained Frontend
- **npm run dev** still works perfectly
- **All existing UI components** preserved
- **Real-time updates** via Firebase listeners
- **Progressive enhancement** with Django features

## Quick Start

### 1. Start Django Backend
```bash
cd backend
python manage.py runserver
# Runs on http://127.0.0.1:8000
```

### 2. Start Next.js Frontend
```bash
cd webuidraftjs_wdb
npm run dev
# Runs on http://localhost:3000
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **Django Admin**: http://127.0.0.1:8000/admin
- **Django API**: http://127.0.0.1:8000/api

## API Endpoints

### Node.js Routes (pages/api/)
| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/verify-captcha` | POST | reCAPTCHA verification (hybrid) |
| `/api/forgot-password` | POST | Password reset (Node.js + Django) |
| `/api/analytics` | GET | Analytics proxy to Django |
| `/api/sync-reports` | POST | Sync reports between systems |

### Django Routes (/api/)
| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/auth/login/` | POST | JWT authentication |
| `/api/auth/register/` | POST | User registration |
| `/api/reports/` | GET/POST | Report CRUD operations |
| `/api/categories/` | GET/POST | Category management |
| `/api/analytics/stats/` | GET | Analytics statistics |

## Environment Configuration

Create `.env.local` in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_ENABLE_HYBRID_MODE=true
NEXT_PUBLIC_ENABLE_DJANGO_SYNC=true
```

## Data Flow

### Report Creation (Hybrid Mode)
1. **User submits report** via Next.js frontend
2. **File upload** to Firebase Storage
3. **Data saved** to Firebase Firestore (primary)
4. **Automatic sync** to Django database (secondary)
5. **Real-time updates** propagated to all connected clients

### Report Management
- **Firebase**: Real-time listeners, immediate UI updates
- **Django**: RESTful API, advanced queries, admin interface
- **Sync**: Bidirectional synchronization via API routes

## Benefits of This Approach

### 🚀 **Gradual Migration**
- Keep existing Firebase functionality working
- Add Django features progressively
- No downtime or data loss

### 🔄 **Best of Both Worlds**
- **Firebase**: Real-time updates, easy scaling, offline support
- **Django**: Relational queries, admin interface, Python ecosystem
- **Node.js**: Familiar frontend tooling, npm packages

### 🛡️ **Redundancy & Reliability**
- Multiple data sources ensure high availability
- Fallback mechanisms if one system fails
- Cross-validation between systems

### 🎯 **Flexibility**
- Switch between data sources dynamically
- Use Firebase for real-time features
- Use Django for complex analytics and reporting

## System Management

Access the **Hybrid System Dashboard** at `/admin` to:
- Monitor system status (Firebase + Django)
- View statistics from both databases
- Perform data synchronization
- Switch between data sources
- Manage API endpoints

## Development Workflow

1. **Frontend development**: Use `npm run dev` as usual
2. **Backend development**: Run Django server alongside
3. **API development**: Add routes in both Node.js and Django
4. **Testing**: Both systems can be tested independently
5. **Deployment**: Deploy both systems with proper configuration

## Future Enhancements

- **WebSocket integration**: Real-time Django notifications
- **Advanced analytics**: Leverage Django's ORM for complex queries
- **Microservices**: Split Django into focused services
- **Load balancing**: Distribute traffic between systems
- **Caching layer**: Redis for improved performance

## Troubleshooting

### Django Backend Not Available
- Check if Django server is running: `python manage.py runserver`
- Verify CORS settings in Django
- Check API URL in environment variables

### Firebase Connection Issues
- Verify Firebase config in `firebase.js`
- Check internet connectivity
- Review Firebase console for errors

### Node.js API Errors
- Check package dependencies: `npm install`
- Verify environment variables
- Review API route implementations

This hybrid approach ensures your existing Firebase functionality remains intact while adding powerful Django backend capabilities. You can gradually migrate features or use both systems in parallel based on your needs.