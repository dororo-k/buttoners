param(
  [Parameter(Position=0)]
  [ValidateSet('dev','prod')]
  [string]$Mode = 'dev'
)

# PowerShell 터미널의 기본 인코딩을 UTF-8로 설정합니다.
$OutputEncoding = [System.Text.Encoding]::UTF8

# 스크립트가 실행되는 위치를 기준으로 프로젝트의 루트 경로를 설정합니다.
$root     = Get-Location
$frontDir = Join-Path -Path $root -ChildPath 'nextjs-portal'
# 'functions' 디렉터리를 백엔드로 사용하고 있으므로 경로를 수정합니다.
$backDir  = Join-Path -Path $root -ChildPath 'functions'

Write-Host "[INFO] ROOT       = $root"
Write-Host "[INFO] FRONT_DIR  = $frontDir"
Write-Host "[INFO] BACK_DIR   = $backDir"
Write-Host "[INFO] MODE       = $Mode"

function Test-CommandExists([string]$name){
  try { return [bool](Get-Command $name -ErrorAction SilentlyContinue) } catch { return $false }
}

function Stop-PortListener([int]$port){
  try {
    $conns = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if($conns){
      ($conns | Select-Object -ExpandProperty OwningProcess -Unique) | ForEach-Object {
        try { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } catch {}
      }
    }
  } catch {}
}

function Wait-ServerReady([string]$url,[int]$timeoutSec=120){
  $deadline = (Get-Date).AddSeconds($timeoutSec)
  while((Get-Date) -lt $deadline){
    try {
      $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
      if($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500){ return $true }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Get-FreePort([int]$start,[int]$end,[int[]]$avoid=@()){
  for($p=$start; $p -le $end; $p++){
    if ($avoid -contains $p) { continue }
    $busy = Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue
    if(-not $busy){ return $p }
  }
  throw "No free port in range $start..$end"
}

$frontPort = $env:FRONT_PORT
if(-not $frontPort){ $frontPort = 3002 }
$backPort  = $env:BACK_PORT
if(-not $backPort){ $backPort  = Get-FreePort 3001 3099 @([int]$frontPort) }
if([int]$frontPort -eq [int]$backPort){ $frontPort = Get-FreePort 3002 3099 @([int]$backPort) }

Write-Host "[INFO] FRONT_PORT = $frontPort"
Write-Host "[INFO] BACK_PORT  = $backPort"

# ---- Launch backend ----
# if(Test-Path (Join-Path $backDir 'package.json')){
#   if($Mode -eq 'prod'){
#     Start-Process cmd -ArgumentList '/k',"title backend-prod && cd /d `"$backDir`" && set PORT=$backPort && npm run start"
#   } else {
#     Start-Process cmd -ArgumentList '/k',"title backend-dev && cd /d `"$backDir`" && set PORT=$backPort && npm run dev"
#   }
# } else {
#   Write-Host "[INFO] Backend skipped (backend/package.json not found)"
# }

# ---- Launch frontend ----
if(Test-Path (Join-Path $frontDir 'package.json')){
  # Always ensure the chosen port is free (prevents stale Next server on fixed port)
  Stop-PortListener -port ([int]$frontPort)

  # Clean stale Next.js build cache to avoid asset mismatch (dev/prod)
  try {
    if (Test-Path (Join-Path $frontDir '.next')) { Remove-Item -Recurse -Force (Join-Path $frontDir '.next') }
  } catch {}

  # Select shell executable (compat with Windows PowerShell 5.x - no ternary)
  $psExe = 'powershell'
  if (Test-CommandExists 'pwsh') { $psExe = 'pwsh' }

  if($Mode -eq 'prod'){
    Start-Process $psExe -ArgumentList "-NoExit", "-Command", "cd '$frontDir'; `$Host.UI.RawUI.WindowTitle = 'Frontend (Prod)'; npm run build; npx next start -p $frontPort"
  } else {
    Start-Process $psExe -ArgumentList "-NoExit", "-Command", "cd '$frontDir'; `$Host.UI.RawUI.WindowTitle = 'Frontend (Dev)'; npx next dev -p $frontPort"
  }

  # Wait until server responds before opening browser
  $ready = Wait-ServerReady -url "http://localhost:$frontPort/" -timeoutSec 120
  if($ready){
    Start-Process "http://localhost:$frontPort"
  } else {
    Write-Warning "[WARN] Frontend did not respond within timeout; you can open http://localhost:$frontPort manually."
  }
} else {
  Write-Error "[ERROR] Frontend folder not found: $frontDir"
}

Write-Host "`n[INFO] 두 개의 창이 실행되었습니다. 이 창은 종료 대기 중입니다."
Write-Host "       Frontend: http://localhost:$frontPort"
Write-Host "       Backend : http://localhost:$backPort"
Read-Host "[INFO] 이 창을 닫으려면 Enter 키를 누르세요"
