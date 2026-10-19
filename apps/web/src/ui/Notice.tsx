import Icon from "./Icon";

interface Props {
  children: string;
  /** An error is red and announced at once; information is ink and announced politely. */
  tone?: "info" | "error";
  /** Large for a notice that leads a screen, small for one beside the thing it is about. */
  size?: "small" | "large";
  className?: string;
}

const sizes = {
  small: { text: "gap-2 text-sm font-bold", icon: 18 },
  large: { text: "gap-2.5 text-[15px] font-semibold", icon: 20 },
};

// Information is flat: an icon and text, with no box.
export default function Notice({ children, tone = "info", size = "small", className = "" }: Props) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={
        `m-0 flex items-start leading-[1.45] ${sizes[size].text} ${tone === "error" ? "text-error" : ""} ` +
        className
      }
    >
      <Icon name="info" size={sizes[size].icon} strokeWidth={2.5} className="mt-px flex-none" />
      <span>{children}</span>
    </p>
  );
}
