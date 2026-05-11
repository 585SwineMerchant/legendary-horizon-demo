type RequiredMediaItem = {
  label: string;
  url: string;
};

function shouldRunAudit(): boolean {
  // DEV-only: never surface missing media warnings for students.
  return Boolean(import.meta.env.DEV || import.meta.env.VITE_LH_MEDIA_AUDIT === 'true');
}

async function checkUrlExists(url: string): Promise<boolean> {
  try {
    // HEAD is ideal, but some static servers don’t support it consistently; GET with no-store is safest.
    const res = await fetch(url, { method: 'GET', cache: 'no-store' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function auditCoreyRequiredMedia(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!shouldRunAudit()) return;

  const required: RequiredMediaItem[] = [
    { label: 'Title continuation music', url: '/assets/Audio/Legendary%20Horizon%20Title.mp3' },
    { label: 'Exploration music loop', url: '/assets/music/lh_exploration_loop.mp3' },
    { label: 'Battle music loop', url: '/assets/music/lh_battle_loop.mp3' },
    { label: 'DaVinci intro export', url: '/assets/intro/intro_davinci.mp4' },
    { label: 'Fog clearing SFX', url: '/assets/Audio/fog%20clearing.wav' },
    { label: 'Scroll unfurling SFX', url: '/assets/Audio/Scroll%20Unfurling.wav' },
    { label: 'Aethelwood battle background', url: '/assets/Battle_screen_aethelwood.png' },
  ];

  const missing: RequiredMediaItem[] = [];

  // Run sequentially to keep console output ordered and avoid request bursts on school networks.
  for (const item of required) {
    const ok = await checkUrlExists(item.url);
    if (!ok) missing.push(item);
  }

  if (!missing.length) {
    // eslint-disable-next-line no-console
    console.info('[LH Media Audit] All required Corey demo media present.');
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(
    '[LH Media Audit] Missing required media assets (DEV-only warning). Add these files under `public/` so the demo has no silent “broken” moments:',
    missing.map((m) => ({ label: m.label, url: m.url })),
  );
}

