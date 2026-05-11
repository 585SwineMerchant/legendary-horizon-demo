import { useMemo, useState } from 'react';

import type { DemoGuidanceStateV1 } from '../demo/demoGuidance';
import type { QuestDefinition } from '../types';

type Props = {
  quests: QuestDefinition[];
  demoGuidance?: DemoGuidanceStateV1;
};

export function QuestDebugPanel({ quests, demoGuidance }: Props) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => JSON.stringify({ demo_guidance_v1: demoGuidance, quests }, null, 2), [demoGuidance, quests]);

  return (
    <div className="lh-quest-debug">
      <button type="button" className="lh-button lh-button--ghost lh-button--small" onClick={() => setOpen((o) => !o)}>
        {open ? 'Hide' : 'Show'} quest state (debug)
      </button>
      {open ? (
        <pre className="lh-quest-debug__pre" role="region" aria-label="Quest definitions JSON">
          {text}
        </pre>
      ) : null}
    </div>
  );
}
