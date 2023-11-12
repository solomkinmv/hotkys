#!/bin/bash
combined_file="public/data/combined-apps.json"

# Initialize the combined JSON object
echo '{"list": [' > "$combined_file"

# Loop through all .json files in the "shortcuts-data" directory
first_file=true
for file in shortcuts-data/*.json; do
  if [ "$first_file" = false ]; then
    echo "," >> "$combined_file"
  else
    first_file=false
  fi

  # Use jq to remove the "$schema" field and concatenate the JSON objects
  jq 'del(.["$schema"])' < "$file" >> "$combined_file"
done

# Close the list and object
echo ']' >> "$combined_file"
echo '}' >> "$combined_file"

# Minify the entire JSON
jq -c . "$combined_file" > tmpfile && mv tmpfile "$combined_file"
