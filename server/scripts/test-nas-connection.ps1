# NAS Connection Diagnostic Script
# Use this to test connectivity to your groupmate's NAS before setup

param(
    [Parameter(Mandatory=$true)]
    [string]$TailscaleIP,
    
    [string]$ShareName = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NAS Connection Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true

# Test 1: Tailscale Connectivity
Write-Host "[Test 1/5] Testing Tailscale connectivity..." -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $TailscaleIP -Count 2 -Quiet
    if ($pingResult) {
        Write-Host "✅ SUCCESS: Can ping $TailscaleIP" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Cannot ping $TailscaleIP" -ForegroundColor Red
        Write-Host "   → Check if Tailscale is running" -ForegroundColor Yellow
        Write-Host "   → Verify you're on the same Tailscale network" -ForegroundColor Yellow
        Write-Host "   → Ask groupmate to verify RPi is online" -ForegroundColor Yellow
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 2: SMB Port (445)
Write-Host "[Test 2/5] Testing SMB port (445)..." -ForegroundColor Yellow
try {
    $smbTest = Test-NetConnection -ComputerName $TailscaleIP -Port 445 -WarningAction SilentlyContinue
    if ($smbTest.TcpTestSucceeded) {
        Write-Host "✅ SUCCESS: SMB port 445 is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Cannot connect to SMB port 445" -ForegroundColor Red
        Write-Host "   → SMB/CIFS service may not be running on RPi" -ForegroundColor Yellow
        Write-Host "   → Firewall may be blocking port 445" -ForegroundColor Yellow
        Write-Host "   → Ask groupmate to check: sudo systemctl status smbd" -ForegroundColor Yellow
        $allTestsPassed = $false
    }
} catch {
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    $allTestsPassed = $false
}
Write-Host ""

# Test 3: List Available Shares
if ($ShareName -eq "") {
    Write-Host "[Test 3/5] Listing available SMB shares..." -ForegroundColor Yellow
    try {
        $shares = net view "\\$TailscaleIP" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ SUCCESS: Can list shares" -ForegroundColor Green
            Write-Host "Available shares:" -ForegroundColor Cyan
            $shares | Where-Object { $_ -match "^\s+\w" } | ForEach-Object {
                Write-Host "   • $_" -ForegroundColor White
            }
        } else {
            Write-Host "⚠️  WARNING: Cannot list shares (authentication may be required)" -ForegroundColor Yellow
            Write-Host "   → This is normal if shares require authentication" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  WARNING: Could not list shares: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[Test 3/5] Testing share access: $ShareName" -ForegroundColor Yellow
    try {
        $sharePath = "\\$TailscaleIP\$ShareName"
        $shareExists = Test-Path $sharePath
        if ($shareExists) {
            Write-Host "✅ SUCCESS: Share '$ShareName' is accessible" -ForegroundColor Green
        } else {
            Write-Host "❌ FAILED: Cannot access share '$ShareName'" -ForegroundColor Red
            Write-Host "   → Share name may be incorrect" -ForegroundColor Yellow
            Write-Host "   → Authentication may be required" -ForegroundColor Yellow
            Write-Host "   → Run without -ShareName to list available shares" -ForegroundColor Yellow
            $allTestsPassed = $false
        }
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $allTestsPassed = $false
    }
}
Write-Host ""

# Test 4: Tailscale Status (if CLI available)
Write-Host "[Test 4/5] Checking Tailscale status..." -ForegroundColor Yellow
try {
    $tailscaleStatus = Get-Command tailscale -ErrorAction SilentlyContinue
    if ($tailscaleStatus) {
        $status = tailscale status 2>&1
        if ($status -match $TailscaleIP) {
            Write-Host "✅ SUCCESS: RPi found in Tailscale network" -ForegroundColor Green
        } else {
            Write-Host "⚠️  WARNING: RPi not found in Tailscale status" -ForegroundColor Yellow
            Write-Host "   → RPi may be offline or on different network" -ForegroundColor Yellow
        }
    } else {
        Write-Host "ℹ️  INFO: Tailscale CLI not found (check Tailscale app instead)" -ForegroundColor Cyan
        Write-Host "   → Open Tailscale app and verify RPi is online" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ℹ️  INFO: Could not check Tailscale CLI status" -ForegroundColor Cyan
}
Write-Host ""

# Test 5: Network Latency
Write-Host "[Test 5/5] Testing network latency..." -ForegroundColor Yellow
try {
    $ping = Test-Connection -ComputerName $TailscaleIP -Count 4 -ErrorAction Stop
    $avgLatency = ($ping | Measure-Object -Property ResponseTime -Average).Average
    Write-Host "✅ Average latency: $([math]::Round($avgLatency, 2)) ms" -ForegroundColor Green
    if ($avgLatency -gt 100) {
        Write-Host "⚠️  WARNING: High latency may affect file transfer performance" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  WARNING: Could not measure latency" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
if ($allTestsPassed) {
    Write-Host "✅ All critical tests passed!" -ForegroundColor Green
    Write-Host "You should be able to proceed with NAS setup." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Get credentials from your groupmate" -ForegroundColor White
    Write-Host "  2. Run: .\setup-nas.ps1 -TailscaleIP `"$TailscaleIP`" -ShareName `"share_name`" ..." -ForegroundColor White
} else {
    Write-Host "❌ Some tests failed" -ForegroundColor Red
    Write-Host "Please resolve the issues above before proceeding." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  • Tailscale not running → Start Tailscale app" -ForegroundColor White
    Write-Host "  • Not on same network → Verify Tailscale network" -ForegroundColor White
    Write-Host "  • SMB service down → Ask groupmate to check RPi" -ForegroundColor White
    Write-Host "  • Firewall blocking → Ask groupmate to check firewall" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Information to share with groupmate
Write-Host "Information to share with your groupmate:" -ForegroundColor Cyan
Write-Host "  • Your Tailscale IP: (check Tailscale app)" -ForegroundColor White
Write-Host "  • RPi Tailscale IP: $TailscaleIP" -ForegroundColor White
Write-Host "  • Test results: $(if ($allTestsPassed) { 'PASSED' } else { 'FAILED - see details above' })" -ForegroundColor White
Write-Host ""

