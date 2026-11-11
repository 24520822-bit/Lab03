import './style.css';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { mountAudioVisualizerApp } from './app';
import { PianoApp } from './piano/PianoApp';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('Application root element is missing');

if (typeof AudioContext === 'undefined') {
  root.textContent = 'This browser does not support the Web Audio API.';
} else {
  mountAudioVisualizerApp(root);
  const pianoRoot = root.querySelector<HTMLElement>('#piano-root');
  if (!pianoRoot) throw new Error('Piano mount point is missing');
  createRoot(pianoRoot).render(createElement(PianoApp));
}
