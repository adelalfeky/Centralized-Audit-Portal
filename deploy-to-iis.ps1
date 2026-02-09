# KPMG GRC Portal - IIS Deployment Script
# Run this script as Administrator on the IIS server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "KPMG GRC Portal - IIS Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$siteName = "KPMG-GRC-Portal"
$appPoolName = "KPMG_GRC_AppPool"
$appPath = "C:\inetpub\wwwroot\kpmg-grc-app"
$port = 80

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Green

# Check if IIS is installed
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if ($iisFeature -and -not $iisFeature.Installed) {
    Write-Host "WARNING: IIS is not installed!" -ForegroundColor Yellow
    $installIIS = Read-Host "Do you want to install IIS? (Y/N)"
    if ($installIIS -eq 'Y') {
        Write-Host "Installing IIS..." -ForegroundColor Yellow
        Install-WindowsFeature -name Web-Server -IncludeManagementTools
        Write-Host "IIS installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "IIS installation cancelled. Cannot proceed." -ForegroundColor Red
        pause
        exit 1
    }
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "  [OK] Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  [X] Node.js not found!" -ForegroundColor Red
    Write-Host "    Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "Step 2: Verifying current directory..." -ForegroundColor Green
$currentDir = Get-Location
if (-not (Test-Path "$currentDir\server.js")) {
    Write-Host "  [X] Not in application directory!" -ForegroundColor Red
    Write-Host "    Please run this script from the application folder" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "  [OK] Current directory: $currentDir" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Installing Node.js dependencies..." -ForegroundColor Green
npm install --production
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [X] npm install failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "  [OK] Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Setting up environment..." -ForegroundColor Green
if (-not (Test-Path ".env")) {
    Copy-Item ".env.production" ".env"
    Write-Host "  [OK] Created .env file from .env.production" -ForegroundColor Green
    Write-Host "  [!] Remember to update JWT_SECRET and SESSION_SECRET in .env!" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Checking database..." -ForegroundColor Green
if (-not (Test-Path "kpmg_grc.db")) {
    Write-Host "  Database not found. Initializing..." -ForegroundColor Yellow
    node seed-requirements.js
    Write-Host "  [OK] Database initialized with requirements" -ForegroundColor Green
} else {
    Write-Host "  [OK] Database exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 6: Copying to IIS directory..." -ForegroundColor Green
$copyToIIS = Read-Host "Copy application to $appPath? (Y/N)"
if ($copyToIIS -eq 'Y') {
    if (-not (Test-Path $appPath)) {
        New-Item -ItemType Directory -Path $appPath -Force | Out-Null
    }
    
    Write-Host "  Copying files..." -ForegroundColor Yellow
    Copy-Item -Path "$currentDir\*" -Destination $appPath -Recurse -Force -Exclude "node_modules",".git","iisnode"
    
    # Copy node_modules separately (faster)
    if (Test-Path "$currentDir\node_modules") {
        Write-Host "  Copying node_modules..." -ForegroundColor Yellow
        robocopy "$currentDir\node_modules" "$appPath\node_modules" /E /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
    }
    
    Write-Host "  [OK] Files copied to $appPath" -ForegroundColor Green
} else {
    $appPath = $currentDir
    Write-Host "  Using current directory as application path" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 7: Setting folder permissions..." -ForegroundColor Green
$acl = Get-Acl $appPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("IIS_IUSRS","Modify","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule)
$accessRule2 = New-Object System.Security.AccessControl.FileSystemAccessRule("IUSR","ReadAndExecute","ContainerInherit,ObjectInherit","None","Allow")
$acl.SetAccessRule($accessRule2)
Set-Acl $appPath $acl
Write-Host "  [OK] Permissions set for IIS_IUSRS and IUSR" -ForegroundColor Green

Write-Host ""
Write-Host "Step 8: Creating IIS Application Pool..." -ForegroundColor Green
Import-Module WebAdministration

# Check if app pool exists
if (Test-Path "IIS:\AppPools\$appPoolName") {
    Write-Host "  Application pool already exists. Removing..." -ForegroundColor Yellow
    Remove-WebAppPool -Name $appPoolName
}

# Create new app pool
New-WebAppPool -Name $appPoolName
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name enable32BitAppOnWin64 -Value $false
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name processModel.idleTimeout -Value "00:00:00"
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name startMode -Value "AlwaysRunning"
Write-Host "  [OK] Application pool '$appPoolName' created" -ForegroundColor Green

Write-Host ""
Write-Host "Step 9: Creating IIS Website..." -ForegroundColor Green

# Check if site exists
if (Test-Path "IIS:\Sites\$siteName") {
    Write-Host "  Website already exists. Removing..." -ForegroundColor Yellow
    Remove-Website -Name $siteName
}

# Create new website
New-Website -Name $siteName `
    -ApplicationPool $appPoolName `
    -PhysicalPath $appPath `
    -Port $port

# Add default document
Add-WebConfiguration -Filter "//defaultDocument/files" `
    -PSPath "IIS:\Sites\$siteName" `
    -Value @{value="index.html"} -ErrorAction SilentlyContinue

Write-Host "  [OK] Website '$siteName' created on port $port" -ForegroundColor Green

Write-Host ""
Write-Host "Step 10: Starting website..." -ForegroundColor Green
Start-Website -Name $siteName
Start-Sleep -Seconds 2

$siteState = (Get-Website -Name $siteName).State
if ($siteState -eq "Started") {
    Write-Host "  [OK] Website is running!" -ForegroundColor Green
} else {
    Write-Host "  [X] Website failed to start. State: $siteState" -ForegroundColor Red
}

Write-Host ""
Write-Host "Step 11: Configuring Windows Firewall..." -ForegroundColor Green
$firewallRule = Get-NetFirewallRule -DisplayName "KPMG GRC Portal HTTP" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    New-NetFirewallRule -DisplayName "KPMG GRC Portal HTTP" `
        -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    Write-Host "  [OK] Firewall rule created for port $port" -ForegroundColor Green
} else {
    Write-Host "  [OK] Firewall rule already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Application Details:" -ForegroundColor Yellow
Write-Host "  Site Name:        $siteName" -ForegroundColor White
Write-Host "  App Pool:         $appPoolName" -ForegroundColor White
Write-Host "  Physical Path:    $appPath" -ForegroundColor White
Write-Host "  Port:             $port" -ForegroundColor White
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Yellow
Write-Host "  Local:            http://localhost:$port" -ForegroundColor White
Write-Host "  Network:          http://$env:COMPUTERNAME:$port" -ForegroundColor White
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object -First 1).IPAddress
Write-Host "  IP Address:       http://${ipAddress}:$port" -ForegroundColor White
Write-Host ""
Write-Host "Default Login:" -ForegroundColor Yellow
Write-Host "  Admin:            admin@kpmg.com / Admin123" -ForegroundColor White
Write-Host "  Department:       corp-it / corp-it123" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test the application by opening: http://localhost:$port" -ForegroundColor White
Write-Host "  2. Update JWT_SECRET in .env file" -ForegroundColor White
Write-Host "  3. Change default passwords" -ForegroundColor White
Write-Host "  4. Configure SSL certificate (optional)" -ForegroundColor White
Write-Host ""
Write-Host "Logs Location:" -ForegroundColor Yellow
Write-Host "  IISNode:          $appPath\iisnode\" -ForegroundColor White
Write-Host "  IIS:              C:\inetpub\logs\LogFiles\" -ForegroundColor White
Write-Host ""

# Open browser
$openBrowser = Read-Host "Open application in browser? (Y/N)"
if ($openBrowser -eq 'Y') {
    Start-Process "http://localhost:$port"
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
