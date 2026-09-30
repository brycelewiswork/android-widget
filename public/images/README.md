# /public/images

Drop reference images, mockups, photos, logos, etc. into this folder.

Files in `public/` are served verbatim from the site root. To use one in the app:

```tsx
<img src="/images/my-photo.png" alt="..." />
```

Or as a CSS background:

```tsx
<div style={{ backgroundImage: "url(/images/my-photo.png)" }} />
```

## When to use `public/` vs `src/assets/`

- **`public/images/` (here)** — static files referenced by URL. No bundling, no hashing, no Vite processing. Best for files you'll add/replace by dropping them in: mockups, reference shots, photos, lots of variants.
- **`src/assets/`** — files you `import`. Vite processes them (hashes filenames for caching, inlines small ones, etc.). Best for assets that are part of the build pipeline: icons, brand SVGs, anything you'd want versioned with the code.

If you're dropping reference images for a sketch session, put them here.
