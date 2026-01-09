# Multi-Package Workspace Build Script
# To be used if generic build failed
# engine -> web

echo "Building engine..."
cd packages/krsplan-engine && npx tsc
cd ../..
echo "Engine built."
