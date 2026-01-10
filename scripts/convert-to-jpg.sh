#!/bin/bash

###############################################################################
# Image to JPG Converter
# 
# Converts images (PNG, SVG, WEBP, etc.) to JPG format
#
# Usage:
#   ./convert-to-jpg.sh <input-file> [output-file]
#   ./convert-to-jpg.sh logo.png
#   ./convert-to-jpg.sh logo.png logo.jpg
###############################################################################

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if input file provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Please provide an input image file${NC}"
    echo ""
    echo "Usage:"
    echo "  ./convert-to-jpg.sh <input-file> [output-file]"
    echo ""
    echo "Examples:"
    echo "  ./convert-to-jpg.sh logo.png"
    echo "  ./convert-to-jpg.sh logo.png logo.jpg"
    echo "  ./convert-to-jpg.sh src/logo.svg public/logo.jpg"
    exit 1
fi

INPUT_FILE="$1"

# Check if input file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}❌ Error: File not found: $INPUT_FILE${NC}"
    exit 1
fi

# Generate output filename if not provided
if [ -z "$2" ]; then
    # Remove extension and add .jpg
    OUTPUT_FILE="${INPUT_FILE%.*}.jpg"
else
    OUTPUT_FILE="$2"
fi

# Check if output file already exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}⚠️  Output file already exists: $OUTPUT_FILE${NC}"
    read -p "Overwrite? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo -e "${YELLOW}❌ Conversion cancelled${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}🔄 Converting $INPUT_FILE to JPG...${NC}"

# Get file extension
EXT="${INPUT_FILE##*.}"
EXT_LOWER=$(echo "$EXT" | tr '[:upper:]' '[:lower:]')

# Convert based on file type
case "$EXT_LOWER" in
    svg)
        # SVG needs special handling - convert to PNG first, then JPG
        echo -e "${YELLOW}📝 Converting SVG (two-step process)...${NC}"
        TEMP_PNG="${INPUT_FILE%.*}_temp.png"
        
        # Try using sips (macOS built-in)
        if command -v sips &> /dev/null; then
            sips -s format png "$INPUT_FILE" --out "$TEMP_PNG" > /dev/null 2>&1
            if [ $? -eq 0 ] && [ -f "$TEMP_PNG" ]; then
                sips -s format jpeg "$TEMP_PNG" --out "$OUTPUT_FILE" > /dev/null 2>&1
                rm -f "$TEMP_PNG"
            else
                echo -e "${RED}❌ SVG conversion failed. Try converting to PNG first.${NC}"
                echo -e "${YELLOW}💡 Tip: Use an online converter or install ImageMagick${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ sips not found. Cannot convert SVG.${NC}"
            exit 1
        fi
        ;;
    png|jpg|jpeg|gif|webp|bmp|tiff|tif)
        # Use sips for common formats
        if command -v sips &> /dev/null; then
            sips -s format jpeg "$INPUT_FILE" --out "$OUTPUT_FILE" > /dev/null 2>&1
            if [ $? -ne 0 ]; then
                echo -e "${RED}❌ Conversion failed!${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ sips not found. Cannot convert image.${NC}"
            exit 1
        fi
        ;;
    *)
        echo -e "${RED}❌ Unsupported file format: .$EXT${NC}"
        echo -e "${YELLOW}Supported formats: PNG, JPG, SVG, WEBP, GIF, BMP, TIFF${NC}"
        exit 1
        ;;
esac

# Check if conversion succeeded
if [ -f "$OUTPUT_FILE" ]; then
    INPUT_SIZE=$(du -h "$INPUT_FILE" | cut -f1)
    OUTPUT_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    
    echo -e "${GREEN}✅ Conversion successful!${NC}"
    echo ""
    echo "Input:  $INPUT_FILE ($INPUT_SIZE)"
    echo "Output: $OUTPUT_FILE ($OUTPUT_SIZE)"
else
    echo -e "${RED}❌ Conversion failed! Output file not created.${NC}"
    exit 1
fi
