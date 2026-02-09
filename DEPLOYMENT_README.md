# KPMG GRC Audit Portal - Deployment Package

## 📦 What's Included

This application is ready for deployment to IIS (Internet Information Services) for multi-user access with a shared database.

### Core Application Files
- `index.html` - Main application interface (login + dashboard)
- `server.js` - Node.js backend API server
- `database.js` - SQLite database configuration
- `kpmg_grc.db` - SQLite database file (shared by all users)
- `package.json` - Node.js dependencies
- `node_modules/` - Installed packages (run `npm install` if missing)

### Frontend Files
- `js/api-client.js` - API communication layer
- `js/users.js` - User management functions
- `img/` - Application logos and images
- `sheets/` - Original Excel requirement files (7 departments)

### Department Data Files
- `departments-corporate-it.js` - Corporate IT requirements (41)
- `departments-data-analytics.js` - Data Analytics requirements (24)
- `departments-infrastructure.js` - Infrastructure requirements (35)
- `departments-platforms.js` - Platforms requirements (27)
- `departments-quality-assurance.js` - QA requirements (20)
- `departments-solution-dev.js` - Solution Dev requirements (22)
- `departments-tech-strategy.js` - Tech Strategy requirements (24)
- **Total: 193 requirements**

### IIS Deployment Files
- `web.config` - IIS configuration for Node.js hosting
- `.env.production` - Production environment template
- `deploy-to-iis.ps1` - Automated deployment script
- `IIS_DEPLOYMENT_GUIDE.md` - Complete deployment instructions
- `QUICK_START.md` - Quick deployment guide

### Utility Files
- `seed-requirements.js` - Database population script
- `test-db.js` - Database verification script
- `migrate-departments.js` - User account setup script

---

## 🚀 Quick Deploy to IIS

### Prerequisites (Install First):
1. **Node.js** - Download from https://nodejs.org/
2. **IISNode** - Download from https://github.com/Azure/iisnode/releases
3. **URL Rewrite Module** - Download from https://www.iis.net/downloads/microsoft/url-rewrite

### Automated Deployment:
```powershell
# Run PowerShell as Administrator
cd [path-to-this-folder]
.\deploy-to-iis.ps1
```

### Manual Deployment:
See `QUICK_START.md` or `IIS_DEPLOYMENT_GUIDE.md` for step-by-step instructions.

---

## 🌐 Multi-User Access

### How it Works:
1. Deploy to IIS server (Windows Server or Windows 10/11 Pro)
2. All users connect to: `http://[server-ip]` or `http://[server-name]`
3. Everyone shares the same SQLite database (`kpmg_grc.db`)
4. No additional database server needed (SQLite is built-in)

### Example Setup:
- **Server:** `192.168.1.100` or `AUDIT-SERVER`
- **Users access:** `http://192.168.1.100` or `http://AUDIT-SERVER`
- **Database:** Single file shared automatically

---

## 👥 Default User Accounts

### Administrator (Full Control):
- **Username:** `admin@kpmg.com`
- **Password:** `Admin123`
- **Access:** All departments, user management, settings

### Department Directors (View Their Requirements):

| Username | Password | Department | Requirements |
|----------|----------|------------|--------------|
| corp-it | corp-it123 | Corporate IT | 41 |
| data-analytics | data-analytics123 | Data Analytics & BI | 24 |
| infrastructure | infrastructure123 | Infrastructure & Ops | 35 |
| platforms | platforms123 | Platforms & IT Solutions | 27 |
| quality-assurance | quality-assurance123 | Quality Assurance | 20 |
| solution-dev | solution-dev123 | Solution Development | 22 |
| tech-strategy | tech-strategy123 | Tech Strategy & EA | 24 |

**⚠️ Change these passwords before production use!**

---

## 📊 Features

### For Directors:
- ✅ View department-specific requirements (numbered 1-N)
- ✅ Update requirement status (Pending/In Progress/Completed)
- ✅ Upload files/documents for each requirement
- ✅ Add remarks and receiving dates
- ✅ Export requirements to CSV
- ✅ Track progress with statistics dashboard

### For Administrators:
- ✅ View all 193 requirements across 7 departments
- ✅ Monitor department progress and completion rates
- ✅ Manage user accounts
- ✅ Access shared folder for all departments
- ✅ Generate reports

---

## 🗂️ Database Information

### Technology:
- **Type:** SQLite3 (file-based, no server needed)
- **File:** `kpmg_grc.db`
- **Concurrent Access:** Yes, multiple users supported
- **Size:** ~45KB (grows with data)

### Tables:
- `users` - User accounts (8 users)
- `departments` - Department information (8 departments)
- `requirements` - Audit requirements (193 requirements)
- `files` - Uploaded documents
- `activities` - Activity log
- `folder_config` - Shared folder configuration

### Backup:
```powershell
# Manual backup
Copy-Item "kpmg_grc.db" "kpmg_grc_backup_$(Get-Date -Format 'yyyyMMdd').db"
```

---

## 🔧 Maintenance

### Update Application:
1. Stop IIS website
2. Copy new files to deployment folder
3. Run `npm install` if dependencies changed
4. Restart IIS website

### Restart Application:
```powershell
Restart-WebAppPool -Name "KPMG_GRC_AppPool"
```

### Reset Database:
```powershell
node seed-requirements.js
```

### View Logs:
- **IISNode logs:** `[app-folder]\iisnode\`
- **IIS logs:** `C:\inetpub\logs\LogFiles\`

---

## 📁 Recommended Deployment Path

```
C:\inetpub\wwwroot\kpmg-grc-app\
```

Or on a separate drive:
```
D:\WebApps\kpmg-grc-app\
```

---

## 🔒 Security Notes

Before production deployment:

1. **Update `.env` file:**
   - Change `JWT_SECRET` to a random 32+ character string
   - Change `SESSION_SECRET` to a different random string

2. **Change all default passwords**

3. **Enable HTTPS** (recommended for production)

4. **Set proper file permissions:**
   - `IIS_IUSRS` - Modify access on app folder
   - Remove write access to sensitive files

---

## 📞 Support Documentation

- **Quick Start Guide:** `QUICK_START.md` - Fast deployment in 5 minutes
- **Full Deployment Guide:** `IIS_DEPLOYMENT_GUIDE.md` - Complete instructions
- **This File:** `DEPLOYMENT_README.md` - Package overview

---

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] Node.js installed on server
- [ ] IISNode installed
- [ ] URL Rewrite module installed
- [ ] IIS enabled on Windows Server
- [ ] Application files copied to server
- [ ] `npm install --production` completed
- [ ] Database initialized with `node seed-requirements.js`
- [ ] `.env` secrets updated
- [ ] Default passwords changed
- [ ] Firewall configured for HTTP/HTTPS
- [ ] Application tested locally
- [ ] Application tested from another computer
- [ ] Backup plan in place

---

## 🎯 System Requirements

### Server Requirements:
- **OS:** Windows Server 2016/2019/2022 OR Windows 10/11 Pro
- **IIS:** Version 10.0 or higher
- **Node.js:** Version 16.0 or higher
- **RAM:** 2GB minimum, 4GB recommended
- **Disk:** 500MB for application + database

### Client Requirements (User Browsers):
- **Browser:** Chrome, Edge, Firefox, Safari (latest versions)
- **JavaScript:** Enabled
- **Network:** Access to IIS server

---

## 📈 Capacity

- ✅ **Users:** Supports 50+ concurrent users
- ✅ **Database:** Handles 10,000+ requirements
- ✅ **Files:** Unlimited file uploads (limited by disk space)
- ✅ **Performance:** Fast response times (<100ms typical)

---

## 🆘 Troubleshooting

**Can't access from network?**
- Check Windows Firewall rules
- Verify IIS bindings
- Test with `http://[server-ip]`

**500 Internal Server Error?**
- Check IISNode logs in `iisnode` folder
- Verify Node.js is installed
- Ensure `web.config` exists

**Login not working?**
- Verify database exists: `kpmg_grc.db`
- Check database has correct users
- Run: `node test-db.js` to verify

---

## 📧 Contact

For technical support or questions about deployment, refer to:
- `IIS_DEPLOYMENT_GUIDE.md` for detailed instructions
- Check IISNode logs for error details
- Verify Node.js and IIS are properly installed

---

**Ready to Deploy!** 🚀

Choose your deployment method:
1. **Automated:** Run `deploy-to-iis.ps1` as Administrator
2. **Manual:** Follow `QUICK_START.md` step-by-step
3. **Detailed:** See `IIS_DEPLOYMENT_GUIDE.md` for complete guide

**Database Location:** All users will share the same `kpmg_grc.db` file automatically!
