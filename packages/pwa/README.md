# PWA / iOS “Installed App” Support

iOS Safari/Chrome best-native-feel approach:
- Provide `manifest.json`
- Provide Apple meta tags for Home Screen
- Use `display: standalone` and `theme_color`

## Required meta tags (Next.js example)
Add to `apps/demo-dashboard/src/app/layout.tsx`:
- `viewport-fit=cover`
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-touch-icon`

## Notes
When launched from Home Screen, the browser chrome is removed and the app feels significantly more native.
