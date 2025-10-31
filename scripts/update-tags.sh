#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Add verbose flag check at the start
verbose=false
for arg in "$@"; do
    if [ "$arg" = "--verbose" ]; then
        verbose=true
    fi
done

# Function for verbose logging
log_verbose() {
    if [ "$verbose" = true ]; then
        echo "$1" >&2
    fi
}

# Function to notify about tag transformations
notify_tag_change() {
    local original="$1"
    local transformed="$2"
    if [ "$original" != "$transformed" ]; then
        echo "Transformed tag: '$original' → '$transformed'"
    fi
}

# Function to generate random hex color
generate_random_color() {
    r=$(printf "%02x" $((RANDOM % 128 + 128)))
    g=$(printf "%02x" $((RANDOM % 128 + 128)))
    b=$(printf "%02x" $((RANDOM % 128 + 128)))
    echo "#$r$g$b"
}

slugify() {
    echo "$1" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | tr -cd 'a-z0-9-'
}

# Function to extract unique tags from MDX files
extract_tags() {
    local dir="$1"
    grep -h "tags:" "$dir"/*.mdx 2>/dev/null | sed 's/tags: \[\(.*\)\]/\1/' | tr ',' '\n' | \
    sed 's/^[ ]*//;s/[ ]*$//' | sed 's/"//g' | sort | uniq
}

get_display_name() {
    echo "$1" | sed -e 's/-/ /g' -e 's/\b\(.\)/\u\1/g'
}

# Determine the directory of the script
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Adjust the path to tags.json
TAGS_JSON="$SCRIPT_DIR/../src/content/tags.json"

# Function to map synonyms to their respective tag IDs
map_synonyms_to_ids() {
    local tag="$1"
    echo "Processing tag: $tag" >&2
    
    # First try direct match
    local primary_tag=$(jq -r --arg tag "$tag" '
        to_entries[] | 
        select(.key == $tag) |
        .key' "$TAGS_JSON")

    # If no direct match, look for synonym
    if [ -z "$primary_tag" ]; then
        primary_tag=$(jq -r --arg tag "$tag" '
            to_entries[] |
            select(.value.synonyms != null and (.value.synonyms | index($tag))) |
            .key' "$TAGS_JSON")
    fi

    # Return the primary tag if found, otherwise return original tag
    if [ ! -z "$primary_tag" ]; then
        echo "$primary_tag"
    else
        echo "$tag"
    fi
}

# Function to process tags in frontmatter
process_tags() {
    local tags="$1"
    local processed_tags=""
    local seen_tags=""

    IFS=',' read -ra tag_array <<< "$tags"
    for tag in "${tag_array[@]}"; do
        # Clean the tag: trim whitespace and quotes, convert to lowercase, replace spaces with hyphens
        tag=$(echo "$tag" | sed 's/^[ "'\''"]*//;s/[ "'\''"]*$//' | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
        tag_id=$(map_synonyms_to_ids "$tag")

        if [ -z "$tag_id" ]; then
            tag_id=$(slugify "$tag")
        fi

        if ! echo "$seen_tags" | grep -q "$tag_id"; then
            seen_tags="$seen_tags $tag_id"
            if [ -n "$processed_tags" ]; then
                processed_tags="$processed_tags, "
            fi
            processed_tags="$processed_tags\"$tag_id\""
        fi
    done

    echo "$processed_tags"
}

fix_tag_formatting() {
    local file="$1"
    temp_file=$(mktemp)

    # Create a function to transform tags inline
    transform_tag() {
        local tag="$1"
        local transformed=$(echo "$tag" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
        if [ "$tag" != "$transformed" ]; then
            notify_tag_change "$tag" "$transformed"
        fi
        echo "$transformed"
    }

    awk -v process_tags_func=process_tags '
    /tags:/ {
        line=$0
        split(line, parts, /tags: *\[/)
        split(parts[2], tags_part, /\]/)
        
        # Transform each tag
        tags=$0
        gsub(/^[^[]*\[|\][^]]*$/, "", tags)  # Extract content between brackets
        split(tags, tag_array, ",")
        new_tags=""
        for (i in tag_array) {
            tag=tag_array[i]
            gsub(/^[ "'\'']*|[ "'\'']*$/, "", tag)  # Trim quotes and spaces
            transformed_tag=transform_tag(tag)
            if (new_tags != "") new_tags = new_tags ", "
            new_tags = new_tags "\"" transformed_tag "\""
        }
        
        print parts[1] "tags: [" new_tags "]"
        next
    }
    { print }
    ' "$file" > "$temp_file"

    mv "$temp_file" "$file"
}

clean_frontmatter_tags() {
    local file="$1"
    temp_file=$(mktemp)

    echo "Processing file: $file" >&2

    awk -v filename="$file" '
    BEGIN { any_changes = 0 }
    /^tags:/ {
        line = $0
        split(line, parts, /tags: *\[/)
        split(parts[2], tags_part, /\]/)
        original_line = $0
        processed = ""
        delete seen_tags
        
        # Debug: Print original line
        printf "Original line: %s\n", original_line > "/dev/stderr"
        
        # Extract tags and remove brackets
        tags = tags_part[1]
        gsub(/^[ "'\'']*|[ "'\'']*$/, "", tags)
        
        # Split and process each tag
        n = split(tags, tag_array, /[ ]*,[ ]*/)
        for (i = 1; i <= n; i++) {
            tag = tag_array[i]
            gsub(/^[ "'\'']*|[ "'\'']*$/, "", tag)
            
            # Get mapped tag
            cmd = "map_synonyms_to_ids \"" tag "\""
            cmd | getline mapped_tag
            close(cmd)
            
            # Debug: Print tag mapping
            printf "Tag: %s, Mapped Tag: %s\n", tag, mapped_tag > "/dev/stderr"
            
            if (!(mapped_tag in seen_tags)) {
                if (processed != "") processed = processed ", "
                processed = processed "\"" mapped_tag "\""
                seen_tags[mapped_tag] = 1
                
                if (tag != mapped_tag) {
                    printf "In %s: Replacing tag \"%s\" with \"%s\"\n", filename, tag, mapped_tag > "/dev/stderr"
                    any_changes = 1
                }
            }
        }
        
        # Construct new line
        new_line = parts[1] "tags: [" processed "]"
        
        # Debug: Print new line
        printf "New line: %s\n", new_line > "/dev/stderr"
        
        if (original_line != new_line) {
            any_changes = 1
            printf "\nUpdated tags in %s\n", filename > "/dev/stderr"
            printf "  From: %s\n  To:   %s\n\n", original_line, new_line > "/dev/stderr"
        }
        print new_line
        next
    }
    { print }
    END {
        if (!any_changes) {
            printf "No changes needed in %s\n", filename > "/dev/stderr"
        }
    }
    ' "$file" > "$temp_file"

    # Only replace if changes were made and temp file is not empty
    if [ -s "$temp_file" ]; then
        mv "$temp_file" "$file"
    else
        rm "$temp_file"
        echo "Error: Empty output file for $file" >&2
        return 1
    fi
}

# Main script
echo -e "${GREEN}Scanning content directories for tags...${NC}"

# Collect all unique tags from specified directories
all_tags=$(
    for dir in src/content/{tech,blog,projects,clients}; do
        if [ -d "$dir" ]; then
            extract_tags "$dir"
        fi
    done | sort | uniq | grep -v '^$'
)

# Read existing tags from tags.json (both keys and name fields)
existing_tag_keys=$(jq -r 'keys[]' src/content/tags.json 2>/dev/null || echo "")
existing_tag_names=$(jq -r '.[] | .name' src/content/tags.json 2>/dev/null || echo "")

# Find new tags
new_tags=""
while IFS= read -r tag; do
    tag_lower=$(echo "$tag" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    tag_id=$(map_synonyms_to_ids "$tag_lower")
    
    log_verbose "Processing tag: $tag_lower -> $tag_id"
    
    if [ -z "$tag_id" ] && \
       ! echo "$existing_tag_keys" | grep -qi "^$(slugify "$tag")$" && \
       ! echo "$existing_tag_names" | grep -qi "^$tag$"; then
        log_verbose "Adding new tag: $tag"
        new_tags="$new_tags$tag"$'\n'
    fi
done <<< "$all_tags"

new_tags=$(echo "$new_tags" | sed '/^$/d')

if [ -z "$new_tags" ]; then
    echo -e "${GREEN}No new tags found. All tags are already in tags.json${NC}"
    exit 0
fi

if [ ! -z "$new_tags" ]; then
    echo -e "${YELLOW}New tags found:${NC}"
    echo -e "ID → Display Name"
    echo -e "---------------"
    while IFS= read -r tag; do
        if [ ! -z "$tag" ]; then
            tag_key=$(slugify "$tag")
            display_name=$(get_display_name "$tag")
            echo -e "$tag_key → $display_name"
        fi
    done <<< "$new_tags"

    if [ "$1" != "--skip-new-prompt" ]; then
        echo -e "\nPress Enter to add these tags to tags.json, or Ctrl+C to exit"
        read -r
    fi
fi

temp_file=$(mktemp)

while IFS= read -r tag; do
    if [ ! -z "$tag" ]; then
        tag_key=$(echo "$tag" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
        color=$(generate_random_color)
        
        category="development"
        case "$tag_lower" in
            *cloud*|*aws*|*hosting*|*docker*) category="cloud" ;;
            *ai*|*llm*|*automation*) category="ai-automation" ;;
            *system*|*nas*|*firewall*) category="systems" ;;
            *business*|*workflow*|*enterprise*) category="business" ;;
            *media*|*audio*|*video*) category="media" ;;
            *design*|*art*) category="design" ;;
        esac

        jq --arg key "$tag_key" \
           --arg name "$tag" \
           --arg desc "$tag" \
           --arg cat "$category" \
           --arg color "$color" \
           '. + {($key): {"name": $name, "description": $desc, "category": $cat, "color": $color}}' \
           src/content/tags.json > "$temp_file"
        mv "$temp_file" src/content/tags.json
    fi
done <<< "$new_tags"

echo -e "${GREEN}Tags have been added to tags.json${NC}"

if [[ " $* " =~ " --clean-frontmatter " ]]; then
    echo -e "${GREEN}Cleaning frontmatter tags...${NC}"
    for dir in src/content/{tech,blog,projects,clients}; do
        if [ -d "$dir" ]; then
            find "$dir" -name "*.mdx" -exec bash -c 'clean_frontmatter_tags "$0"' {} \;
        fi
    done
    echo -e "${GREEN}Frontmatter tags cleaned${NC}"
fi