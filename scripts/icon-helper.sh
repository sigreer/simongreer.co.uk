#!/bin/bash

ICONS_DIR="/src/components/Icons"

show_usage() {
    echo "Usage: batchrename.sh <command> [filename]"
    echo ""
    echo "Commands:"
    echo "  add-suffixes        Add 'Icon' suffix to all .astro files"
    echo "  repair-suffixes     Fix incorrect 'Icon' suffixes in filenames"
    echo "  inject-frontmatter  Add frontmatter to existing SVG files"
    echo "  new-icon <name>     Create a new icon component"
    exit 1
}

addFrontmatter() {
    for svg_file in "$ICONS_DIR"/*.svg; do
    
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
    for file in "$ICONS_DIR"/*.astro; do
        base_name=$(basename "$file" .astro)
        
        # Capitalize the first letter and add 'Icon' to the end
        new_name="${base_name}Icon.astro"

        if [[ "$file" != "$ICONS_DIR/$new_name" ]]; then
            mv "$file" "$ICONS_DIR/$new_name"
            echo "Renamed $file to $new_name"
        fi
    done

    echo "Renaming completed!"
}

removeExtraIconSuffix() {
    for file in "$ICONS_DIR"/*.astro; do
        base_name=$(basename "$file" .astro)
        
        # More robust suffix handling
        # Remove all 'Icon' occurrences except for the last one
        while [[ "$base_name" =~ (.*)Icon(.+)Icon$ ]]; do
            base_name="${BASH_REMATCH[1]}${BASH_REMATCH[2]}Icon"
        done
        
        new_name="$ICONS_DIR/${base_name}.astro"

        if [[ "$file" != "$new_name" ]]; then
            mv "$file" "$new_name"
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

    # Create the file with frontmatter in the Icons directory
    filepath="$ICONS_DIR/$filename"
    
    cat > "$filepath" << 'EOL'
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

# Main command handling
if [ $# -eq 0 ]; then
    show_usage
fi

case "$1" in
    "add-suffixes")
        addIconSuffix
        ;;
    "repair-suffixes")
        removeExtraIconSuffix
        ;;
    "inject-frontmatter")
        addFrontmatter
        ;;
    "new-icon")
        if [ -z "$2" ]; then
            echo "Error: Please provide a name for the new icon"
            show_usage
        fi
        createIcon "$2"
        ;;
    *)
        echo "Error: Unknown command '$1'"
        show_usage
        ;;
esac