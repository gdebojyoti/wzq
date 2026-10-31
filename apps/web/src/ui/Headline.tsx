interface Props {
  children: string;
  /** One line under the headline, saying what happens next. */
  hint: string;
}

// What's happening in the Game, in large type between the Players and the Board.
export default function Headline({ children, hint }: Props) {
  return (
    <div className="flex flex-col gap-1.5 border-t-3 border-ink px-0.5 pt-1.5">
      <h1 aria-live="polite" className="m-0 font-display text-[34px] leading-[1.05] uppercase">{children}</h1>
      <span className="text-sm font-semibold">{hint}</span>
    </div>
  );
}
