import type { ComponentProps } from "react";

interface Props extends ComponentProps<"button"> {
  /** Pink for the screen's primary action, white for a secondary one. */
  variant: "primary" | "secondary";
  /** Large for the main actions on a screen, small for Leave game in the header. The caller sets the size itself. */
  shadow: "large" | "small";
}

const variants = {
  primary: "bg-pink",
  secondary: "bg-surface",
};

// A hard offset shadow marks something pressable: it grows on hover, and the button presses into it.
const shadows = {
  large:
    "shadow-[6px_6px_0_var(--color-ink)] enabled:hover:shadow-[7px_7px_0_var(--color-ink)] " +
    "enabled:active:translate-x-[5px] enabled:active:translate-y-[5px]",
  small:
    "shadow-[4px_4px_0_var(--color-ink)] enabled:hover:shadow-[5px_5px_0_var(--color-ink)] " +
    "enabled:active:translate-x-1 enabled:active:translate-y-1",
};

export default function Button({ variant, shadow, className = "", ...props }: Props) {
  return (
    <button
      type="button"
      className={
        "flex cursor-pointer items-center justify-center border-3 border-ink font-display text-ink uppercase " +
        "transition-[translate,box-shadow] duration-75 enabled:hover:-translate-x-px enabled:hover:-translate-y-px " +
        "enabled:active:shadow-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ink " +
        `disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${variants[variant]} ${shadows[shadow]} ` +
        className
      }
      {...props}
    />
  );
}
