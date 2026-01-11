import { createRoot } from 'react-dom/client';
import { BuilderApp } from './App';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<BuilderApp />);
}
