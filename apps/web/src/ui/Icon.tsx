// The line icons the screens use, drawn in the current text colour.
const paths = {
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  leave: (
    <>
      <path d="M10 20H4V4h6" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" />
      <path d="M5 15H3V3h12v2" />
    </>
  ),
  check: <path d="m4 12 5 5L20 6" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <path d="M12 16v.5" />
    </>
  ),
};

interface Props {
  name: keyof typeof paths;
  size: number;
  strokeWidth?: number;
  className?: string;
}

export default function Icon({ name, size, strokeWidth = 3, className }: Props) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
