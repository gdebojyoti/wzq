import type { ComponentProps } from "react";

export default function Button(props: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="rounded border border-stone-400 bg-white px-4 py-2 hover:bg-stone-100 disabled:opacity-50"
      {...props}
    />
  );
}
