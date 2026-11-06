import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
document.documentElement.classList.add('js');
createRoot(document.getElementById('root')).render(<App />);

