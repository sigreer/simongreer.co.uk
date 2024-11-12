#!/bin/bash

#!/bin/bash

# Directory containing the .astro files (use "." for the current directory)
# ICON_DIR="."

# # Loop through each .astro file in the directory
# for astro_file in "$ICON_DIR"/*.astro; do
#     # Create a temporary file to store modifications
#     tmp_file="${astro_file}.tmp"
    
#     # Insert Astro frontmatter and modify the <svg> tag
#     {
#         # Add Astro frontmatter
#         echo "---"
#         echo "interface Props {"
#         echo "  fill?: string;"
#         echo "  class?: string;"
#         echo "}"
#         echo ""
#         echo "const { fill = \"#000000\", class: className } = Astro.props;"
#         echo "---"
        
#         # Replace the <svg> tag in the original file
#         sed 's/<svg[^>]*>/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fill} class={className}>/' "$astro_file"
#     } > "$tmp_file"
    
#     # Replace the original file with the modified version
#     mv "$tmp_file" "$astro_file"
# done

# echo "Frontmatter addition and <svg> tag modification completed!"


# DIR="./"
# for file in "$DIR"/*.astro; do
#     # Get the base filename without path or extension
#     base_name=$(basename "$file" .astro)
    
#     # Capitalize the first letter
#     new_name="$(tr '[:lower:]' '[:upper:]' <<< ${base_name:0:1})${base_name:1}.astro"
    
#     # Rename the file if the new name is different
#     if [[ "$file" != "$DIR/$new_name" ]]; then
#         mv "$file" "$DIR/$new_name"
#         echo "Renamed $file to $new_name"
#     fi
# done

# echo "Renaming completed!"

DIR="./"
 for file in "$DIR"/*.astro; do
base_name=$(basename "$file" .astro)
    
# Capitalize the first letter and add 'Icon' to the end
new_name="${base_name}Icon.astro"

if [[ "$file" != "$DIR/$new_name" ]]; then
    mv "$file" "$DIR/$new_name"
       echo "Renamed $file to $new_name"
    fi
done

echo "Renaming completed!"