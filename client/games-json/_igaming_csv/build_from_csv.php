<?php
/**
 * Convert iGaming "Games Library" CSV exports into the games-json/*.json format
 * the casino lobby reads (get_lobby_games.php).
 *
 * iGaming CSV columns: Game ID, Game Name, Brand, Category, Image URL
 *   - The "Game ID" column is blank in exports, BUT the numeric game_uid is
 *     embedded in the Image URL:
 *       https://imagedelivery.net/<acct>/<ID>/public   -> <ID>
 *       https://igamingapis.com/img/<ID>.png           -> <ID>
 *   - That numeric ID is the launch game_uid (verified: launching 6312 returned
 *     "IP not whitelisted" instead of "Invalid Game Code", i.e. the code is valid).
 *
 * Output: one JSON file per Brand, grouped, with objects shaped exactly like the
 * existing lobby JSON: {gameid, gamename, providerName, image}.
 *
 * Images: ALWAYS use the imagedelivery.net CDN built from the gameid
 * (https://imagedelivery.net/nVyft9zNw2I0pNVtrnC1zA/<ID>/public). The
 * igamingapis.com/img/<ID>.png variant 404s, while imagedelivery resolves 200.
 *
 * Usage (CLI):  php build_from_csv.php
 * Reads every *.csv in this folder and writes the JSON up one level.
 */

$csvDir  = __DIR__;
$outDir  = dirname(__DIR__);                 // games-json/
$IMG_CDN = 'https://imagedelivery.net/nVyft9zNw2I0pNVtrnC1zA/'; // + <id>/public

/** Pull the numeric game id out of any iGaming image URL. */
function extract_id($imageUrl) {
    if (preg_match('#imagedelivery\.net/[^/]+/(\d+)/#', $imageUrl, $m)) return $m[1];
    if (preg_match('#/img/(\d+)\.#', $imageUrl, $m)) return $m[1];
    if (preg_match('#/(\d{2,7})(?:/|\.|$)#', $imageUrl, $m)) return $m[1];
    return '';
}

/** Brand -> output filename (mirrors the existing naming convention). */
function brand_to_file($brand) {
    $b = trim($brand);
    // Normalise the few brands we care about to match the lobby's live grouping.
    $map = [
        'Evolution Live'        => 'Evolution_Live',
        'Evolution Live (Asia)' => 'Evolution_Live_-_Asia',
        'PragmaticPlayLive-EU'  => 'PragmaticPlay_Live_-_EU',
        'PragmaticPlayLive-Asia'=> 'PragmaticPlay_Live_-_Asia',
        'Microgaming'           => 'Microgaming_Live',
        'Ezugi'                 => 'Ezugi',
    ];
    if (isset($map[$b])) return $map[$b];
    // Generic: keep it filesystem-safe.
    $f = preg_replace('/[^A-Za-z0-9]+/', '_', $b);
    return trim($f, '_') ?: 'Other';
}

$byFile = [];   // filename => [ {gameid,gamename,providerName,image}, ... ]
$seen   = [];   // dedupe by gameid+file

$csvFiles = glob($csvDir . '/*.csv') ?: [];
$totalRows = 0; $skipped = 0;

foreach ($csvFiles as $csv) {
    if (($fh = fopen($csv, 'r')) === false) continue;
    $header = fgetcsv($fh);  // skip header row
    while (($row = fgetcsv($fh)) !== false) {
        if (count($row) < 5) { $skipped++; continue; }
        [$gid, $name, $brand, $cat, $img] = array_pad($row, 5, '');
        $name  = trim($name);
        $brand = trim($brand);
        $img   = trim($img);
        if ($name === '' || $img === '') { $skipped++; continue; }

        $id = $gid !== '' && ctype_digit(trim($gid)) ? trim($gid) : extract_id($img);
        if ($id === '') { $skipped++; continue; }

        $file = brand_to_file($brand);
        $key  = $file . '|' . $id;
        if (isset($seen[$key])) continue;
        $seen[$key] = 1;

        $byFile[$file][] = [
            'gameid'       => (string)$id,
            'gamename'     => $name,
            'providerName' => $brand !== '' ? $brand : 'Live Casino',
            'image'        => $IMG_CDN . $id . '/public',
        ];
        $totalRows++;
    }
    fclose($fh);
}

if (!$byFile) { fwrite(STDERR, "No rows parsed from any CSV in $csvDir\n"); exit(1); }

foreach ($byFile as $file => $games) {
    $path = $outDir . '/' . $file . '.json';
    file_put_contents($path, json_encode($games, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    echo str_pad($file, 32) . ' -> ' . count($games) . " games\n";
}
echo "\nTotal: $totalRows games written, $skipped rows skipped.\n";
