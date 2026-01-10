# Convert Image to JPG - Quick Guide

## Quick Answer

**Yes!** You can convert images to JPG format. I've created a script for you.

---

## Method 1: Using the Script (Easiest)

### Convert any image to JPG:

```bash
# Navigate to project
cd /Users/macbook/transport-management-system

# Convert image
./scripts/convert-to-jpg.sh <input-file> [output-file]

# Examples:
./scripts/convert-to-jpg.sh logo.png
./scripts/convert-to-jpg.sh logo.png logo.jpg
./scripts/convert-to-jpg.sh src/logo.svg public/logo.jpg
```

### What it does:
- ✅ Converts PNG, SVG, WEBP, GIF, BMP, TIFF to JPG
- ✅ Automatically generates output filename
- ✅ Shows file sizes before/after
- ✅ Works on macOS (uses built-in `sips` tool)

---

## Method 2: Manual Conversion (macOS)

### Using Terminal (sips):

```bash
# Convert PNG to JPG
sips -s format jpeg input.png --out output.jpg

# Convert SVG (two-step: SVG → PNG → JPG)
sips -s format png input.svg --out temp.png
sips -s format jpeg temp.png --out output.jpg
rm temp.png
```

### Using Preview (GUI):

1. Open image in Preview
2. File → Export
3. Format: JPEG
4. Choose quality
5. Save

---

## Method 3: Online Converters

If you prefer online tools:
- **CloudConvert**: https://cloudconvert.com/png-to-jpg
- **Convertio**: https://convertio.co/png-jpg/
- **Zamzar**: https://www.zamzar.com/convert/png-to-jpg/

---

## Convert Your Logo Files

### Convert existing logos:

```bash
cd /Users/macbook/transport-management-system

# Convert logo192.png to JPG
./scripts/convert-to-jpg.sh public/logo192.png public/logo192.jpg

# Convert logo512.png to JPG
./scripts/convert-to-jpg.sh public/logo512.png public/logo512.jpg

# Convert SVG logo (if you have one)
./scripts/convert-to-jpg.sh src/logo.svg public/logo.jpg
```

---

## Batch Convert Multiple Images

```bash
# Convert all PNG files in a directory
for file in *.png; do
    ./scripts/convert-to-jpg.sh "$file"
done
```

---

## Quality Settings

The default conversion uses good quality. To adjust:

```bash
# High quality (larger file)
sips -s format jpeg input.png --out output.jpg --setProperty formatOptions high

# Medium quality (balanced)
sips -s format jpeg input.png --out output.jpg --setProperty formatOptions medium

# Low quality (smaller file)
sips -s format jpeg input.png --out output.jpg --setProperty formatOptions low
```

---

## Troubleshooting

### "sips not found"
- This shouldn't happen on macOS (sips is built-in)
- Try: `which sips` to verify

### "SVG conversion failed"
- SVG files need special handling
- The script converts SVG → PNG → JPG automatically
- If it fails, try converting to PNG first, then to JPG

### "File not found"
- Check the file path
- Use absolute path: `/Users/macbook/transport-management-system/logo.png`

---

## Quick Test

```bash
# Test the script
cd /Users/macbook/transport-management-system
./scripts/convert-to-jpg.sh public/logo192.png public/logo192.jpg
```

---

## Summary

✅ **Script created:** `scripts/convert-to-jpg.sh`  
✅ **Works with:** PNG, SVG, WEBP, GIF, BMP, TIFF  
✅ **Output:** JPG format  
✅ **Easy to use:** Just run the script!

**Want to convert a specific image? Tell me the file path!**
