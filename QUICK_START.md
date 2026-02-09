# KPMG GRC Audit Portal - Quick Deployment to IIS

## 🚀 Quick Start (Automated)

1. **Install Prerequisites** (One-time setup):
   - Install Node.js: https://nodejs.org/ (Download LTS version)
   - Install IISNode: https://github.com/Azure/iisnode/releases (Get latest .msi)
   - Install URL Rewrite: https://www.iis.net/downloads/microsoft/url-rewrite

2. **Deploy the Application**:
   ```powershell
   # Run PowerShell as Administrator
   cd D:\KPMG_GRC_APP
   .\deploy-to-iis.ps1
   ```

3. **Access the Portal**:
   - Open browser: `http://localhost`
   - Login: `admin@kpmg.com` / `Admin123`

**That's it!** The script handles everything automatically.

---

## 📋 Manual Deployment (Step by Step)

If you prefer manual setup:

### 1. Install Prerequisites
- Install IIS (Windows Feature)
- Install Node.js (v16+)
- Install IISNode module
- Install URL Rewrite module

### 2. Prepare Application
```powershell
# Navigate to app folder
cd D:\KPMG_GRC_APP

# Install dependencies
npm install --production

# Setup environment
copy .env.production .env

# Initialize database
node seed-requirements.js
```

### 3. Copy to IIS Directory
```powershell
# Create folder
New-Item -Path "C:\inetpub\wwwroot\kpmg-grc-app" -ItemType Directory

# Copy files
Copy-Item -Path "D:\KPMG_GRC_APP\*" -Destination "C:\inetpub\wwwroot\kpmg-grc-app" -Recurse
```

### 4. Create IIS Website
- Open IIS Manager
- Create Application Pool: "KPMG_GRC_AppPool" (No Managed Code)
- Create Website: "KPMG-GRC-Portal"
- Point to: `C:\inetpub\wwwroot\kpmg-grc-app`
- Port: 80 or 8080

### 5. Set Permissions
- Right-click app folder → Properties → Security
- Add `IIS_IUSRS` with Modify permission

### 6. Test
- Browse to: `http://localhost`

---

## 🌐 Network Access

### Allow Multiple Users:

1. **Open Firewall** (on IIS server):
   ```powershell
   New-NetFirewallRule -DisplayName "KPMG GRC Portal" `
       -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow
   ```

2. **Access from other computers**:
   - Use server IP: `http://192.168.1.100`
   - Or server name: `http://SERVER-NAME`

### Shared Database

All users automatically share the same database (`kpmg_grc.db`). No additional configuration needed!

---

## 👥 User Accounts

**Administrator** (Full access):
- Username: `admin@kpmg.com`
- Password: `Admin123`

**Department Directors** (View their requirements):
- Corporate IT: `corp-it` / `corp-it123` (41 requirements)
- Data Analytics: `data-analytics` / `data-analytics123` (24 requirements)
- Infrastructure: `infrastructure` / `infrastructure123` (35 requirements)
- Platforms: `platforms` / `platforms123` (27 requirements)
- Quality Assurance: `quality-assurance` / `quality-assurance123` (20 requirements)
- Solution Dev: `solution-dev` / `solution-dev123` (22 requirements)
- Tech Strategy: `tech-strategy` / `tech-strategy123` (24 requirements)

**Total:** 193 requirements across 7 departments

---

## 🔧 Common Tasks

### Restart Application:
```powershell
Restart-WebAppPool -Name "KPMG_GRC_AppPool"
```

### View Logs:
- IISNode logs: `C:\inetpub\wwwroot\kpmg-grc-app\iisnode\`
- IIS logs: `C:\inetpub\logs\LogFiles\`

### Backup Database:
```powershell
Copy-Item "C:\inetpub\wwwroot\kpmg-grc-app\kpmg_grc.db" `
    "C:\Backups\kpmg_grc_$(Get-Date -Format 'yyyyMMdd').db"
```

### Update Application:
1. Copy new files to application folder
2. Run: `Restart-WebAppPool -Name "KPMG_GRC_AppPool"`

---

## 🐛 Troubleshooting

**Problem:** Can't access from other computers
- **Solution:** Check firewall, ensure port 80/8080 is open

**Problem:** 500 Internal Server Error
- **Solution:** Check `iisnode` folder for error logs

**Problem:** Login fails
- **Solution:** Check database file exists and has proper permissions

**Problem:** Static files (images/CSS) not loading
- **Solution:** Verify `web.config` exists in app folder

---

## 📁 File Structure

```
C:\inetpub\wwwroot\kpmg-grc-app\
├── index.html              ← Main page (login + dashboard)
├── server.js               ← Node.js backend API
├── database.js             ← Database connection
├── kpmg_grc.db            ← SQLite database (shared by all users)
├── web.config             ← IIS configuration
├── .env                   ← Environment settings
├── package.json           
├── node_modules/          
├── js/                    ← Frontend JavaScript
│   ├── api-client.js
│   └── users.js
├── img/                   ← Images and logos
└── sheets/                ← Original Excel requirement files
```

---

## 🔒 Security Recommendations

Before going to production:

1. **Change secrets in `.env`**:
   ```
   JWT_SECRET=generate-a-random-32-character-string-here
   SESSION_SECRET=another-random-32-character-string
   ```

2. **Change default passwords** for all users

3. **Enable HTTPS** (see full guide: `IIS_DEPLOYMENT_GUIDE.md`)

4. **Restrict access** by IP if needed (IIS IP Security)

---

## 📞 Support Files

- **Full Deployment Guide:** `IIS_DEPLOYMENT_GUIDE.md`
- **Automated Script:** `deploy-to-iis.ps1`
- **This Quick Start:** `QUICK_START.md`

---

## ✅ Deployment Checklist

- [ ] Node.js installed
- [ ] IISNode installed
- [ ] URL Rewrite module installed
- [ ] Application copied to IIS folder
- [ ] Dependencies installed (`npm install --production`)
- [ ] Database initialized (`node seed-requirements.js`)
- [ ] IIS website created
- [ ] Permissions set (IIS_IUSRS)
- [ ] Firewall configured
- [ ] Application tested locally
- [ ] Application tested from network
- [ ] Default passwords changed
- [ ] `.env` secrets updated

---

**Ready to Deploy!** 🎉

Run: `.\deploy-to-iis.ps1` as Administrator and you're done!
