#!/bin/bash

addFrontmatter() {
    ICON_DIR="."
    for svg_file in "$ICON_DIR"/*.svg; do
    
        # Check if the file already contains a frontmatter fence
        if grep -q "^---" "$svg_file"; then
            echo "Frontmatter already exists in $svg_file, skipping..."
            continue
        fi

        tmp_file="${svg_file}.tmp"
        
        {
            echo "---"
            echo "interface Props {"
            echo "  fill?: string;"
            echo "  class?: string;"
            echo "}"
            echo ""
            echo "const { fill = \"#000000\", class: className } = Astro.props;"
            echo "---"
            
            sed 's/<svg[^>]*>/<svg xmlns="http:\/\/www.w3.org\/2000\/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fill} class={className}>/' "$svg_file"
        } > "$tmp_file"
        
        base_name="${svg_file%.svg}"
        if [[ ! "$base_name" =~ Icon$ ]]; then
            base_name="${base_name}Icon"
        fi
        mv "$tmp_file" "${base_name}.astro"
    done

    echo "Frontmatter addition and <svg> tag modification completed. File saved as .astro."
}

addIconSuffix() {
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
}

removeExtraIconSuffix() {
    DIR="./"
    for file in "$DIR"/*.astro; do
        base_name=$(basename "$file" .astro)
        
        # Remove only the last 'Icon' from the end if present
        if [[ "$base_name" =~ IconIcon$ ]]; then
            new_name="${base_name%IconIcon}Icon.astro"
        else
            new_name="${base_name}.astro"
        fi

        if [[ "$file" != "$DIR/$new_name" ]]; then
            mv "$file" "$DIR/$new_name"
            echo "Renamed $file to $new_name"
        fi
    done

    echo "Renaming completed!"
}

createIcon() {
    if [ -z "$1" ]; then
        echo "Error: Please provide a filename as an argument"
        return 1
    fi

    # Ensure filename ends with Icon.astro
    filename="$1"
    if [[ ! "$filename" =~ Icon\.astro$ ]]; then
        if [[ "$filename" =~ \.astro$ ]]; then
            filename="${filename%.astro}Icon.astro"
        else
            filename="${filename}Icon.astro"
        fi
    fi

    # Create the file with frontmatter
    cat > "$filename" << 'EOL'
---
interface Props {
  fill?: string;
  class?: string;
}

const { fill = "#000000", class: className } = Astro.props;
---

<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fill} class={className}>
</svg>
EOL

    echo "Created $filename with frontmatter template"
}

# addIconSuffix
# removeExtraIconSuffix
createIcon "$1"
#addFrontmatter