import { useMemo, useState } from 'react';

import type { QuestDefinition } from '../types';

type Props = {
  quests: QuestDefinition[];
};

export function QuestDebugPanel({ quests }: Props) {
  const [open, setOpen] = useState(false);
  const text = useMemo(() => JSON.stringify(quests, null, 2), [quests]);

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
