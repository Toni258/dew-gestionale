function normalizePath(value, fallback) {
    const raw = String(value ?? fallback).trim();
    if (!raw) return fallback;

    const withLeadingSlash = raw.startsWith('/') ? raw : `/${raw}`;
    return withLeadingSlash.replace(/\/+$/, '') || fallback;
}

export const clientConfig = {
    foodImagesPublicPath: normalizePath(
        import.meta.env.VITE_FOOD_IMAGES_PUBLIC_PATH,
        '/food-images',
    ),
};
