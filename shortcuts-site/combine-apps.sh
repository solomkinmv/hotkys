#!/bin/bash
combined_file="public/combined-apps.json"
echo '{"list": [' > "$combined_file"

first_file=true
for file in shortcuts-data/*.json; do
  if [ "$first_file" = false ]; then
    echo "," >> "$combined_file"
  else
    first_file=false
  fi
  cat "$file" >> "$combined_file"
done

echo ']' >> "$combined_file"
echo '}' >> "$combined_file"
