/**
 * Dynamically import all images in the Saints folder using Vite's glob import.
 * This ensures assets are processed and bundled correctly by Vite.
 */
const imageModules = import.meta.glob('../../../Saints/*.{jpg,png,jpeg}', { eager: true, import: 'default' }) as Record<string, string>;

/**
 * Get the fully resolved URL for a given saint image filename.
 * @param pictureFilename e.g., '1 Lideta Mariam – Birth of St. Mary.jpg'
 */
export function getSaintImageUrl(pictureFilename: string): string {
  // Try to find the exact filename match in the keys of our glob object
  const match = Object.entries(imageModules).find(([path]) => {
    return path.endsWith(`/${pictureFilename}`) || path.endsWith(pictureFilename);
  });
  
  return match ? match[1] : '';
}
