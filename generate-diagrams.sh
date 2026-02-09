#!/usr/bin/env bash
set -euo pipefail

MARKDOWN_FILE="${1:-ARCHITECTURE.md}"
OUTPUT_DIR="${2:-diagrams}"

if [ ! -f "$MARKDOWN_FILE" ]; then
  echo "Error: $MARKDOWN_FILE not found"
  exit 1
fi

if ! command -v mmdc &> /dev/null; then
  echo "Error: mermaid-cli (mmdc) not found. Install with: npm install -g @mermaid-js/mermaid-cli"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Extract mermaid blocks: track line numbers of ```mermaid and next ```
index=0
in_block=false
block=""
section_name=""

while IFS= read -r line; do
  # Capture the most recent markdown heading for naming
  if [[ "$line" =~ ^#{1,4}[[:space:]]+(.*) ]]; then
    section_name="${BASH_REMATCH[1]}"
    # Slugify: lowercase, replace non-alphanum with hyphens, trim hyphens
    section_name=$(echo "$section_name" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//')
  fi

  if [[ "$line" == '```mermaid' ]]; then
    in_block=true
    block=""
    continue
  fi

  if $in_block; then
    if [[ "$line" == '```' ]]; then
      in_block=false
      index=$((index + 1))
      padded=$(printf "%02d" "$index")
      name="${padded}-${section_name}"
      mmd_file="$OUTPUT_DIR/${name}.mmd"
      svg_file="$OUTPUT_DIR/${name}.svg"

      echo "$block" > "$mmd_file"
      echo "Generating $svg_file ..."
      if mmdc -i "$mmd_file" -o "$svg_file" -b transparent -p .puppeteerrc.json 2>&1; then
        echo "  OK"
      else
        echo "  FAILED"
      fi
    else
      if [ -n "$block" ]; then
        block="$block"$'\n'"$line"
      else
        block="$line"
      fi
    fi
  fi
done < "$MARKDOWN_FILE"

echo ""
echo "Done. Generated $index diagram(s) in $OUTPUT_DIR/"
