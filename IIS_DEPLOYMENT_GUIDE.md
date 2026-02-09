# IIS Deployment Guide for KPMG GRC Audit Portal

## Prerequisites

Before deploying to IIS, ensure you have:

1. **Windows Server** with IIS installed (Windows Server 2016/2019/2022 or Windows 10/11 Pro)
2. **Node.js** installed (v16 or higher) - Download from https://nodejs.org/
3. **IISNode** module installed - Download from https://github.com/Azure/iisnode/releases
4. **URL Rewrite Module** for IIS - Download from https://www.iis.net/downloads/microsoft/url-rewrite
5. **Administrator access** to the IIS server

---

## Step 1: Install Required IIS Features

1. Open **Server Manager** → **Manage** → **Add Roles and Features**
2. Select **Web Server (IIS)** and install these features:
   - Web Server
   - Application Development → CGI
   - Application Development → WebSocket Protocol
   - Security → Request Filtering
   - Management Tools → IIS Management Console

Or use PowerShell (Run as Administrator):
```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
Install-WindowsFeature -name Web-CGI
Install-WindowsFeature -name Web-WebSockets
```

---

## Step 2: Install IISNode

1. Download **IISNode** from: https://github.com/Azure/iisnode/releases
2. Install for your architecture (x64 recommended)
3. Restart IIS after installation:
   ```powershell
   iisreset
   ```

---

## Step 3: Install URL Rewrite Module

1. Download from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module
3. Restart IIS

---

## Step 4: Prepare the Application

1. **Copy the application folder** to your IIS server:
   - Recommended location: `C:\inetpub\wwwroot\kpmg-grc-app`
   - Or: `D:\WebApps\kpmg-grc-app`

2. **Install Node.js dependencies**:
   ```powershell
   cd C:\inetpub\wwwroot\kpmg-grc-app
   npm install --production
   ```

3. **Configure environment variables**:
   - Copy `.env.production` to `.env`
   - Edit `.env` and update:
     - `JWT_SECRET` - Change to a secure random string
     - `SESSION_SECRET` - Change to a secure random string
     - `PORT` - Default is 5000

4. **Initialize the database**:
   ```powershell
   node seed-requirements.js
   ```

5. **Set folder permissions**:
   - Right-click the application folder → Properties → Security
   - Add `IIS_IUSRS` group with **Modify** permissions
   - Add `IUSR` user with **Read & Execute** permissions

---

## Step 5: Create IIS Website

### Option A: Using IIS Manager (GUI)

1. Open **IIS Manager** (Run: `inetmgr`)

2. **Create Application Pool**:
   - Right-click **Application Pools** → **Add Application Pool**
   - Name: `KPMG_GRC_AppPool`
   - .NET CLR version: **No Managed Code**
   - Managed pipeline mode: **Integrated**
   - Click **OK**

3. **Configure Application Pool**:
   - Right-click `KPMG_GRC_AppPool` → **Advanced Settings**
   - Set **Enable 32-Bit Applications**: `False`
   - Set **Start Mode**: `AlwaysRunning`
   - Set **Idle Time-out (minutes)**: `0` (never timeout)
   - Click **OK**

4. **Create Website**:
   - Right-click **Sites** → **Add Website**
   - Site name: `KPMG-GRC-Portal`
   - Application pool: Select `KPMG_GRC_AppPool`
   - Physical path: `C:\inetpub\wwwroot\kpmg-grc-app`
   - Binding:
     - Type: `http`
     - IP address: `All Unassigned` (or specific IP)
     - Port: `80` (or `8080` if 80 is in use)
     - Host name: (optional, e.g., `kpmg-audit.local`)
   - Click **OK**

5. **Set Default Document**:
   - Double-click your website → **Default Document**
   - Add: `index.html`
   - Move it to the top of the list

### Option B: Using PowerShell

```powershell
# Import IIS module
Import-Module WebAdministration

# Create Application Pool
New-WebAppPool -Name "KPMG_GRC_AppPool"
Set-ItemProperty IIS:\AppPools\KPMG_GRC_AppPool -Name managedRuntimeVersion -Value ""
Set-ItemProperty IIS:\AppPools\KPMG_GRC_AppPool -Name enable32BitAppOnWin64 -Value $false

# Create Website
New-Website -Name "KPMG-GRC-Portal" `
    -ApplicationPool "KPMG_GRC_AppPool" `
    -PhysicalPath "C:\inetpub\wwwroot\kpmg-grc-app" `
    -Port 80

# Start the website
Start-Website -Name "KPMG-GRC-Portal"
```

---

## Step 6: Configure Firewall

If accessing from other computers:

```powershell
# Allow HTTP traffic
New-NetFirewallRule -DisplayName "KPMG GRC Portal HTTP" `
    -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Or for port 8080
New-NetFirewallRule -DisplayName "KPMG GRC Portal HTTP 8080" `
    -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

---

## Step 7: Test the Deployment

1. **On the server**, open a browser and navigate to:
   - `http://localhost`
   - Or: `http://localhost:8080` (if using port 8080)

2. **From another computer** on the network:
   - `http://[SERVER-IP]`
   - Or: `http://kpmg-audit.local` (if you configured host name)

3. **Login with test credentials**:
   - Admin: `admin@kpmg.com` / `Admin123`
   - Department: `corp-it` / `corp-it123`

---

## Step 8: Configure for Multiple Users

### Database Connection

The SQLite database (`kpmg_grc.db`) supports multiple concurrent users. No additional configuration needed.

### Performance Optimization

1. **Enable IIS Compression**:
   - IIS Manager → Select server → **Compression**
   - Enable both dynamic and static compression

2. **Configure Caching**:
   - Select your site → **Output Caching**
   - Add caching rules for static files (.js, .css, .png, etc.)

---

## Step 9: Configure HTTPS (Optional but Recommended)

### Create Self-Signed Certificate (Testing):

```powershell
# Create certificate
$cert = New-SelfSignedCertificate -DnsName "kpmg-audit.local" `
    -CertStoreLocation "cert:\LocalMachine\My"

# Bind to IIS
New-WebBinding -Name "KPMG-GRC-Portal" -Protocol "https" -Port 443
$binding = Get-WebBinding -Name "KPMG-GRC-Portal" -Protocol "https"
$binding.AddSslCertificate($cert.Thumbprint, "my")
```

### For Production (using CA-signed certificate):

1. Obtain SSL certificate from Certificate Authority
2. Install certificate in Windows Certificate Store
3. Bind to IIS website:
   - IIS Manager → Site → **Bindings** → **Add**
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select your certificate

---

## Step 10: Monitoring and Logs

### Check Logs:

1. **IISNode Logs**:
   - Located in: `C:\inetpub\wwwroot\kpmg-grc-app\iisnode`
   - Contains Node.js console output and errors

2. **IIS Logs**:
   - Default location: `C:\inetpub\logs\LogFiles`

3. **Application Logs**:
   - Check Windows Event Viewer → Windows Logs → Application

### Restart the Application:

```powershell
# Restart application pool
Restart-WebAppPool -Name "KPMG_GRC_AppPool"

# Or restart entire website
Stop-Website -Name "KPMG-GRC-Portal"
Start-Website -Name "KPMG-GRC-Portal"
```

---

## Troubleshooting

### Issue: 500 Internal Server Error

**Solution**:
- Check IISNode logs in `iisnode` folder
- Ensure Node.js is installed and in system PATH
- Verify `web.config` exists in application root

### Issue: Cannot find module errors

**Solution**:
```powershell
cd C:\inetpub\wwwroot\kpmg-grc-app
npm install
```

### Issue: Database locked errors

**Solution**:
- Ensure `IIS_IUSRS` has **Modify** permission on database file
- Check SQLite journal files aren't locked

### Issue: Static files not loading

**Solution**:
- Verify web.config static content rules
- Check IIS static content MIME types
- Ensure folders have read permissions

### Issue: CORS errors

**Solution**:
- Update `.env` file: `CORS_ORIGIN=*`
- Or specify allowed origins: `CORS_ORIGIN=http://your-domain.com`

---

## Access URLs

After successful deployment, users can access the portal:

- **Internal Network**: `http://[server-ip]` or `http://[server-name]`
- **With DNS**: `http://kpmg-audit.company.com`
- **HTTPS**: `https://kpmg-audit.company.com`

---

## User Accounts

Default accounts (change passwords in production):

**Administrator**:
- Username: `admin@kpmg.com`
- Password: `Admin123`

**Department Directors**:
- Corporate IT: `corp-it` / `corp-it123`
- Data Analytics: `data-analytics` / `data-analytics123`
- Infrastructure: `infrastructure` / `infrastructure123`
- Platforms: `platforms` / `platforms123`
- Quality Assurance: `quality-assurance` / `quality-assurance123`
- Solution Dev: `solution-dev` / `solution-dev123`
- Tech Strategy: `tech-strategy` / `tech-strategy123`

---

## Maintenance

### Update Application:

1. Stop the website
2. Copy new files to application folder
3. Run `npm install` if dependencies changed
4. Start the website

### Backup Database:

```powershell
# Create backup
Copy-Item "C:\inetpub\wwwroot\kpmg-grc-app\kpmg_grc.db" `
    "C:\Backups\kpmg_grc_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

### Schedule Automatic Backups:

Create a scheduled task to backup database daily.

---

## Support

For issues or questions:
- Check IISNode logs: `[app-folder]\iisnode\`
- Check IIS logs: `C:\inetpub\logs\LogFiles`
- Restart app pool: `Restart-WebAppPool -Name "KPMG_GRC_AppPool"`

---

## File Structure

```
C:\inetpub\wwwroot\kpmg-grc-app\
├── index.html              (Main application)
├── server.js               (Node.js backend)
├── database.js             (Database configuration)
├── kpmg_grc.db            (SQLite database - shared by all users)
├── web.config             (IIS configuration)
├── .env                   (Environment variables)
├── package.json           (Dependencies)
├── node_modules/          (Node packages)
├── js/                    (JavaScript files)
├── img/                   (Images and logos)
├── sheets/                (Original Excel files)
└── iisnode/               (IISNode logs)
```

---

**Deployment Complete!** 🎉

All users on the network can now access the portal and share the same database.
