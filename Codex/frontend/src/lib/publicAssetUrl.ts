export function publicAssetUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `/legendary-horizon-demo/${cleanPath}`;
}
