#!/bin/bash
# Revert to original 2-column product layout (remove 3D logo center)

echo "Reverting to original product layout..."
cp src/components/Products.tsx.backup src/components/Products.tsx
echo "✓ Products.tsx restored from backup"
echo ""
echo "To see the changes, refresh your browser at http://localhost:3000/products"
echo ""
echo "Note: The 3D spinning logo component and image will remain in your project"
echo "but won't be displayed. You can safely delete these files if you want:"
echo "  - src/components/LogoSymbol3DSpinning.tsx"
echo "  - src/assets/logo-symbol.png"
