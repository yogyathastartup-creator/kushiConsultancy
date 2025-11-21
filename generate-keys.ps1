$bytes1 = New-Object Byte[] 64
$bytes2 = New-Object Byte[] 64
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes1)
$rng.GetBytes($bytes2)
$key1 = [Convert]::ToBase64String($bytes1)
$key2 = [Convert]::ToBase64String($bytes2)
Write-Output $key1
Write-Output $key2
