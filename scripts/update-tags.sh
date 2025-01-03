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

# Function to map synonyms to their respective tag IDs
map_synonyms_to_ids() {
    local tag="$1"
    log_verbose "Checking tag: $tag"
    local tag_id=$(jq -r --arg tag "$tag" '
        to_entries | .[] | 
        select(
            .key == $tag or 
            (.value.synonyms | type == "array" and contains([$tag]))
        ) | .key' src/content/tags.json)
    log_verbose "Found ID: $tag_id"
    echo "$tag_id"
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