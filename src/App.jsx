import React, { useEffect, useState } from 'react';
import Library from './pages/Library.jsx';
import Viewer from './pages/Viewer.jsx';

function parseHash() {
  const m = window.location.hash.match(/^#\/book\/([\w-]+)/);
  return m ? { name: 'book', id: m[1] } : { name: 'library' };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route.name === 'book') return <Viewer key={route.id} bookId={route.id} />;
  return <Library />;
}
