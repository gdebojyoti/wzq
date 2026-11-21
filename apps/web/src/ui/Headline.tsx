interface Props {
  children: string;
  /** One line under the headline, saying what happens next. A desktop screen leaves it out once the Game has ended. */
  hint?: string;
}

// What's happening in the Game, in large type: between the Players and the Board on mobile, and under the Players in
// a desktop sidebar.
export default function Headline({ children, hint }: Props) {
  return (
    <div
      className={
        "flex flex-col gap-1.5 border-t-3 border-ink px-0.5 pt-1.5 " +
        "desktop:gap-2.5 desktop:border-t-0 desktop:px-0 desktop:pt-0"
      }
    >
      <h1
        aria-live="polite"
        className="m-0 font-display text-[34px] leading-[1.05] uppercase desktop:text-[48px] desktop:leading-none"
      >
        {children}
      </h1>
      {hint && <span className="text-sm font-semibold desktop:text-base">{hint}</span>}
    </div>
  );
}
