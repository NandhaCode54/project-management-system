import { useEffect, useState } from 'react';

export function notifyDataChanged() {
  window.dispatchEvent(new CustomEvent('pms:data-changed'));
}

export function useDataVersion() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener('pms:data-changed', handler);
    return () => window.removeEventListener('pms:data-changed', handler);
  }, []);

  return version;
}