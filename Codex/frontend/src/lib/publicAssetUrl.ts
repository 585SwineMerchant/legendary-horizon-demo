export function publicAssetUrl(path: string): string {
  const cleanPath = path.replace(/^\/+/, '');
  return `https://585swinemerchant.github.io/legendary-horizon-demo/${cleanPath}`;
}
