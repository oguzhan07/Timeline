import { useEffect, useState } from 'react';

export default function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const minutes = now.getHours() * 60 + now.getMinutes();
  const top = (minutes / 60) * 60; // HOUR_HEIGHT = 60

  return <div className="current-time-line" style={{ top: `${top}px` }} />;
}
