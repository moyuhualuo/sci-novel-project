import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function Svg({ className, children, viewBox = "0 0 24 24" }: IconProps & { children: ReactNode; viewBox?: string }) {
  return (
    <svg className={className} viewBox={viewBox} fill="none" aria-hidden="true">
      {children}
    </svg>
  );
}

export function BrandIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
      <path d="M4 12c2.1-4.9 13.9-4.9 16 0-2.1 4.9-13.9 4.9-16 0Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 4c4.9 2.1 4.9 13.9 0 16-4.9-2.1-4.9-13.9 0-16Z" stroke="currentColor" strokeWidth="1.6" opacity="0.72" />
    </Svg>
  );
}

export function HomeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 10.5 12 4l8 6.5V20H4v-9.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.2 20v-5.8h5.6V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </Svg>
  );
}

export function LogsIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.7 9h14.6M4.7 15h14.6M12 4a13.2 13.2 0 0 1 0 16M12 4a13.2 13.2 0 0 0 0 16" stroke="currentColor" strokeWidth="1.4" />
    </Svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M16.8 3.8a7.8 7.8 0 1 0 3.4 14.8A8.8 8.8 0 1 1 16.8 3.8Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </Svg>
  );
}

export function AmberIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3.5c4.1 2.8 6.2 5.8 6.2 9.1A6.2 6.2 0 1 1 5.8 12.6c0-3.3 2.1-6.3 6.2-9.1Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8.1v6.8M8.8 11.4h6.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function MistIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 10.3c.8-2 2.8-3.3 5-3.3 2.4 0 4.4 1.4 5.2 3.6a3.5 3.5 0 1 1 .6 6.9H8.8A3.8 3.8 0 0 1 5 13.7c0-1.2.3-2.3 1-3.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M7.2 19.2h9.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15 15 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}
