const paths = {
  trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
  refresh: 'M20 7v5h-5M4 17v-5h5M5.1 7a8 8 0 0 1 13.2-2L20 7M4 17l1.7 2A8 8 0 0 0 19 17',
  home: 'm3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  services: 'm14.7 6.3 3 3M3 21l6-6M14 3a6 6 0 0 0-6 8l-5 5a3 3 0 0 0 5 5l5-5a6 6 0 0 0 8-8l-4 4-5-5 4-4z',
  calendar: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M8 14h2M14 14h2M8 18h2',
  marketplace: 'm3 9 2-6h14l2 6M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9H3M5 14v7h14v-7M10 21v-6h4v6',
  orders: 'M8 3H5a1 1 0 0 0-1 1v17l4-2 4 2 4-2 4 2V4a1 1 0 0 0-1-1h-3M9 2h6v4H9zM8 10h8M8 14h5',
  store: 'M4 7h16v14H4zM3 3h18v4H3zM9 11h6',
  chevronRight: 'm9 5 7 7-7 7', chevronDown: 'm6 9 6 6 6-6', arrowUp: 'm7 17 10-10M7 7h10v10', arrowRight: 'M4 12h16m-6-6 6 6-6 6',
  search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', menu: 'M3 6h18M3 12h18M3 18h18', close: 'm6 6 12 12M6 18 18 6',
  wallet: 'M20 8V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v12H5a3 3 0 0 1-3-3V6M21 13h-5v4h5',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5', clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  box: 'm12 3 9 5-9 5-9-5 9-5M3 8v9l9 5 9-5V8M12 13v9M7 5l10 6', shield: 'm12 3 9 4v5c0 5-9 10-9 10S3 17 3 12V7zM8 12l3 3 5-5',
  check: 'm5 12 4 4L19 6', more: 'M5 12h.01M12 12h.01M19 12h.01', mail: 'M3 5h18v14H3zM3 5l9 8 9-8', location: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
}
export default function Icon({ name, size = 20, className = '' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true"><path d={paths[name] || paths.box} /></svg>
}
