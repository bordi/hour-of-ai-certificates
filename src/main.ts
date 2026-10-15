import { route } from './router';

// The app is loaded only once the URL carries a language; otherwise we are already redirecting.
if (route()) void import('./app');
