$ErrorActionPreference = "Stop"

$agentFolder = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$agentPath = Join-Path $agentFolder "index.mjs"
$taskName = "Adams Elite Auto Printer"

$action = New-ScheduledTaskAction `
  -Execute $nodePath `
  -Argument ('"' + $agentPath + '"') `
  -WorkingDirectory $agentFolder

$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -RestartCount 10 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Prints paid Adams Elite online orders automatically." `
  -Force | Out-Null

Write-Host "Installed startup task: $taskName"
Write-Host "It will start automatically whenever this Windows user signs in."
