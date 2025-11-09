$files = Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    # Fix Card imports
    $content = $content -replace 'import Card from ''@components/ui/Card''', 'import { Card } from ''@components/ui/Card'''
    
    # Fix Button imports
    $content = $content -replace 'import Button from ''@components/ui/Button''', 'import { Button } from ''@components/ui/Button'''
    
    # Fix Input imports
    $content = $content -replace 'import Input from ''@components/ui/Input''', 'import { Input } from ''@components/ui/Input'''
    
    # Fix Select imports
    $content = $content -replace 'import Select from ''@components/ui/Select''', 'import { Select } from ''@components/ui/Select'''
    
    # Fix Badge imports
    $content = $content -replace 'import Badge from ''@components/ui/Badge''', 'import { Badge } from ''@components/ui/Badge'''
    
    # Fix Progress imports
    $content = $content -replace 'import Progress from ''@components/ui/Progress''', 'import { Progress } from ''@components/ui/Progress'''
    
    # Fix @types imports
    $content = $content -replace 'from ''@types''', 'from ''@/types'''
    
    # Update file with fixed imports
    Set-Content -Path $file.FullName -Value $content
}

Write-Host "Import fixes completed"