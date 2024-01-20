#!/bin/bash

# Specify the directories and file paths
data_dir="shortcuts-data"
output_file="public/sitemap.txt"

# Traverse all JSON files in the "shortcuts-data" directory
for file in "$data_dir"/*.json; do
  bundle_id=$(jq -r '.bundleId' "$file")
  if [ "$bundle_id" != "null" ]; then
    url="https://shortcuts.solomk.in/?/apps/$bundle_id"
    echo "$url" >> "$output_file"
  fi
done
