const common = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export const IconGrid = (props) => (
  <svg {...common} {...props}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconServer = (props) => (
  <svg {...common} {...props}>
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <circle cx="7" cy="7" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="7" cy="17" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const IconTerminal = (props) => (
  <svg {...common} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M7 9l3 3-3 3" />
    <path d="M13 15h4" />
  </svg>
);

export const IconTools = (props) => (
  <svg {...common} {...props}>
    <path d="M14.5 3.5a3 3 0 0 0-4.24 4.24L4 14v3h3l6.26-6.26a3 3 0 0 0 4.24-4.24l-2.5 2.5-2-2z" />
  </svg>
);

export const IconPlus = (props) => (
  <svg {...common} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconLogout = (props) => (
  <svg {...common} {...props}>
    <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const IconRefresh = (props) => (
  <svg {...common} {...props}>
    <path d="M3 12a9 9 0 0 1 15.3-6.4L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.3 6.4L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const IconTrash = (props) => (
  <svg {...common} {...props}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M6 7l1 13h10l1-13" />
  </svg>
);

export const IconCheck = (props) => (
  <svg {...common} {...props}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const IconActivity = (props) => (
  <svg {...common} {...props}>
    <path d="M3 12h4l2 8 4-16 2 8h6" />
  </svg>
);

export const IconChevronRight = (props) => (
  <svg {...common} {...props}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);
