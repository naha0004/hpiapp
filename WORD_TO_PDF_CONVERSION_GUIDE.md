# Converting Word Forms to Fillable PDFs

## The Problem
When you convert Word documents with form fields to PDF using basic conversion methods, the fillable form fields get "flattened" and become static text, losing their interactive functionality.

## Solution 1: Microsoft Word Export (Recommended)

If you still have the original Word documents:

1. **Open the Word document** in Microsoft Word
2. **Go to File → Export → Create PDF/XPS**
3. **Click "Options"**
4. **Make sure these are checked:**
   - ✅ "Create bookmarks using" (if you have headings)
   - ✅ "Document structure tags for accessibility"
   - ✅ **"ISO 19005-1 compliant (PDF/A)" - UNCHECK this**
   - ✅ **"Include markup" - UNCHECK this if you don't want comments**
5. **Most importantly: Check "Create PDF forms"** (this preserves form fields)
6. **Click OK and then Publish**

## Solution 2: Adobe Acrobat Pro

If you have Adobe Acrobat Pro:
1. Open the Word document in Acrobat Pro
2. It will automatically detect and convert form fields
3. Go to "Prepare Form" to fine-tune field properties

## Solution 3: LibreOffice (Free Alternative)

1. Open the Word document in LibreOffice Writer
2. Go to File → Export as PDF
3. In the PDF Options dialog, make sure "Create PDF form" is checked
4. Export

## Solution 4: Recreate Form Fields Programmatically

If the above don't work, we can inspect the current PDFs and add form fields programmatically using our PDF service.

## Testing the Result

After conversion, test the PDF by:
1. Opening it in a PDF viewer
2. Checking if you can click on form fields
3. Running our field inspector: `python3 inspect_pdf_fields.py pdf_templates/PE2.pdf PE2`
