<?php
// save-name.php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = $_POST['name'] ?? '';
    $filename = $_POST['filename'] ?? 'QuakeName.txt';

    // Convert the encoding from UTF-8 to windows-1252
    $name = mb_convert_encoding($name, 'Windows-1252', 'UTF-8');

    // Set the correct headers to force the file download
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
    header('Content-Length: ' . strlen($name));
    
    // Output the file content
    echo $name;
    exit;
}
?>