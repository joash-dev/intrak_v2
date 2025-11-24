# INTRAK NAS Setup Script for Windows with Tailscale
# This script helps configure NAS connection for the INTRAK application

param(
    [Parameter(Mandatory=$true)]
    [string]$TailscaleIP,
    
    [Parameter(Mandatory=$true)]
    [string]$ShareName,
    
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [string]$DriveLetter = "Z:",
    
    [string]$BasePath = "intrak"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "INTRAK NAS Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Test Tailscale connectivity
Write-Host "[1/6] Testing Tailscale connectivity..." -ForegroundColor Yellow
$pingResult = Test-Connection -ComputerName $TailscaleIP -Count 2 -Quiet
if (-not $pingResult) {
    Write-Host "❌ Cannot reach NAS at $TailscaleIP" -ForegroundColor Red
    Write-Host "   Please verify:" -ForegroundColor Yellow
    Write-Host "   - Tailscale is running on both devices" -ForegroundColor Yellow
    Write-Host "   - Both devices are in the same Tailscale network" -ForegroundColor Yellow
    Write-Host "   - NAS Tailscale IP is correct" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ NAS is reachable at $TailscaleIP" -ForegroundColor Green
Write-Host ""

# Step 2: Test SMB port
Write-Host "[2/6] Testing SMB connection (port 445)..." -ForegroundColor Yellow
$smbTest = Test-NetConnection -ComputerName $TailscaleIP -Port 445 -WarningAction SilentlyContinue
if (-not $smbTest.TcpTestSucceeded) {
    Write-Host "❌ Cannot connect to SMB port 445" -ForegroundColor Red
    Write-Host "   Please verify SMB/CIFS service is enabled on your NAS" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ SMB port is accessible" -ForegroundColor Green
Write-Host ""

# Step 3: Map network drive
Write-Host "[3/6] Mapping network drive..." -ForegroundColor Yellow
$networkPath = "\\$TailscaleIP\$ShareName"

# Check if drive is already mapped
if (Test-Path $DriveLetter) {
    Write-Host "⚠️  Drive $DriveLetter is already mapped" -ForegroundColor Yellow
    $response = Read-Host "Do you want to remap it? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        Remove-PSDrive -Name $DriveLetter.TrimEnd(':') -ErrorAction SilentlyContinue
        net use $DriveLetter /delete /y 2>$null
    } else {
        Write-Host "Skipping drive mapping..." -ForegroundColor Yellow
    }
}

# Map the drive
try {
    $securePassword = ConvertTo-SecureString $Password -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential($Username, $securePassword)
    
    New-PSDrive -Name $DriveLetter.TrimEnd(':') -PSProvider FileSystem -Root $networkPath -Persist -Credential $credential | Out-Null
    
    # Verify mapping
    Start-Sleep -Seconds 2
    if (Test-Path $DriveLetter) {
        Write-Host "✅ Network drive mapped successfully to $DriveLetter" -ForegroundColor Green
    } else {
        throw "Drive mapping failed"
    }
} catch {
    Write-Host "❌ Failed to map network drive: $_" -ForegroundColor Red
    Write-Host "   Trying alternative method..." -ForegroundColor Yellow
    
    # Alternative: Use net use command
    $netUseCmd = "net use $DriveLetter $networkPath /persistent:yes /user:$Username $Password"
    cmd /c $netUseCmd
    
    if (Test-Path $DriveLetter) {
        Write-Host "✅ Network drive mapped using alternative method" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to map network drive. Please map manually." -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Step 4: Create directory structure
Write-Host "[4/6] Creating directory structure..." -ForegroundColor Yellow
$directories = @(
    "$DriveLetter\$BasePath",
    "$DriveLetter\$BasePath\documents",
    "$DriveLetter\$BasePath\documents\temp",
    "$DriveLetter\$BasePath\profile-photos",
    "$DriveLetter\$BasePath\templates"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        try {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Host "✅ Created: $dir" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to create: $dir - $_" -ForegroundColor Red
        }
    } else {
        Write-Host "ℹ️  Already exists: $dir" -ForegroundColor Cyan
    }
}
Write-Host ""

# Step 5: Test write access
Write-Host "[5/6] Testing write access..." -ForegroundColor Yellow
$testFile = "$DriveLetter\$BasePath\documents\.test_write"
try {
    "NAS connection test" | Out-File -FilePath $testFile -Encoding UTF8
    $content = Get-Content $testFile
    Remove-Item $testFile -Force
    Write-Host "✅ Write access verified" -ForegroundColor Green
} catch {
    Write-Host "❌ Write access test failed: $_" -ForegroundColor Red
    Write-Host "   Please check folder permissions" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 6: Generate .env configuration
Write-Host "[6/6] Generating .env configuration..." -ForegroundColor Yellow
$envPath = Join-Path $PSScriptRoot "..\.env"
$envContent = @"

# ============================================
# NAS Configuration (Tailscale VPN)
# Generated by setup-nas.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# ============================================
USE_NAS=true
NAS_PATH=$DriveLetter\$BasePath
NAS_HOST=$TailscaleIP
NAS_USERNAME=$Username
NAS_PASSWORD=$Password
NAS_SHARE_NAME=$ShareName

"@

# Check if .env exists
if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to update NAS configuration? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        # Read existing .env
        $existingContent = Get-Content $envPath -Raw
        
        # Remove old NAS config if exists
        $existingContent = $existingContent -replace '(?s)# ============================================\s*# NAS Configuration.*?NAS_SHARE_NAME=.*?\n', ''
        
        # Append new NAS config
        $newContent = $existingContent + $envContent
        Set-Content -Path $envPath -Value $newContent
        Write-Host "✅ Updated .env file with NAS configuration" -ForegroundColor Green
    } else {
        Write-Host "Skipping .env update. Manual configuration required." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Add these lines to your .env file:" -ForegroundColor Cyan
        Write-Host $envContent -ForegroundColor White
    }
} else {
    # Create new .env file
    Set-Content -Path $envPath -Value $envContent
    Write-Host "✅ Created .env file with NAS configuration" -ForegroundColor Green
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "  • Network drive: $DriveLetter → $networkPath" -ForegroundColor White
Write-Host "  • Base path: $DriveLetter\$BasePath" -ForegroundColor White
Write-Host "  • Configuration: $envPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the .env file configuration" -ForegroundColor White
Write-Host "  2. Restart your Node.js server" -ForegroundColor White
Write-Host "  3. Test file upload through the application" -ForegroundColor White
Write-Host ""
Write-Host "To verify NAS connection, check server logs for:" -ForegroundColor Cyan
Write-Host "  ✅ 'NAS connection validated successfully'" -ForegroundColor Green
Write-Host ""

