# Download all corporate images from Pexels/Unsplash to public/images/
# Source: Fonsi44/app-workspace-20260606034849/design_guidelines.json + data/services.js

$ErrorActionPreference = "Continue"

# 6 corporate images
$corporate = @{
    "hero_home"        = "https://images.pexels.com/photos/9367109/pexels-photo-9367109.jpeg?auto=compress&cs=tinysrgb&w=1600"
    "hero_despacho"    = "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?auto=format&fit=crop&w=1600&q=80"
    "services_general" = "https://images.pexels.com/photos/30483132/pexels-photo-30483132.jpeg?auto=compress&cs=tinysrgb&w=1600"
    "services_penal"   = "https://images.pexels.com/photos/6077797/pexels-photo-6077797.jpeg?auto=compress&cs=tinysrgb&w=1600"
    "courthouse"       = "https://images.pexels.com/photos/36595111/pexels-photo-36595111.jpeg?auto=compress&cs=tinysrgb&w=1600"
    "corporate_meeting"= "https://images.pexels.com/photos/36733421/pexels-photo-36733421.jpeg?auto=compress&cs=tinysrgb&w=1600"
}

# 13 services
$services = @{
    "familia"               = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80"
    "laboral"               = "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=1200&q=80"
    "civil"                 = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80"
    "mercantil"             = "https://images.unsplash.com/photo-1664575602554-2087b04935a5?auto=format&fit=crop&w=1200&q=80"
    "bancario"              = "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?auto=format&fit=crop&w=1200&q=80"
    "administrativo"        = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"
    "aduanero"              = "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80"
    "sanitario"             = "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
    "extranjeria"           = "https://images.unsplash.com/photo-1569974264716-91516dabd9c7?auto=format&fit=crop&w=1200&q=80"
    "propiedad-intelectual" = "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80&sat=-100"
    "tributario"            = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1200&q=80"
    "ambiental"             = "https://images.unsplash.com/photo-1473773508845-188df298d2d1?auto=format&fit=crop&w=1200&q=80"
    "arbitraje"             = "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=1200&q=80"
}

# 7 penal services
$penal = @{
    "litigio-complejo"         = "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?auto=format&fit=crop&w=1200&q=80"
    "resolucion-alternativa"   = "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80"
    "penal-juvenil"            = "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80"
    "representacion-integral"  = "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&w=1200&q=80"
    "recursos-impugnaciones"   = "https://images.unsplash.com/photo-1589994160957-da4c5d50e26b?auto=format&fit=crop&w=1200&q=80"
    "consultoria-preventiva"   = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=80"
    "penitenciario"            = "https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=1200&q=80"
}

function Download-Set($set, $dir) {
    $ok = 0; $fail = 0
    foreach ($k in $set.Keys) {
        $url = $set[$k]
        $ext = ".jpg"
        $out = Join-Path $dir "$k$ext"
        try {
            $ProgressPreference = "SilentlyContinue"
            Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing -TimeoutSec 30
            $size = (Get-Item $out).Length
            if ($size -gt 1000) { $ok++ ; Write-Host "OK  $k ($size B)" } else { $fail++ ; Write-Host "EMPTY $k ($size B)" }
        } catch {
            $fail++
            Write-Host "FAIL $k -- $($_.Exception.Message)"
        }
    }
    Write-Host "--- $dir : $ok ok, $fail fail ---"
    return @{ ok = $ok; fail = $fail }
}

$r1 = Download-Set $corporate "public\images\corporate"
$r2 = Download-Set $services  "public\images\services"
$r3 = Download-Set $penal     "public\images\penal"

$totalOk = $r1.ok + $r2.ok + $r3.ok
$totalFail = $r1.fail + $r2.fail + $r3.fail
Write-Host "================="
Write-Host "TOTAL: $totalOk ok, $totalFail fail"
