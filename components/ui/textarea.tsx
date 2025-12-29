import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  /**
   * If true, the textarea will automatically resize based on its content.
   * @default true
   */
  autoResize?: boolean;

  /**
   * Minimum height of the textarea.
   * @default "80px"
   */
  minHeight?: string;

  /**
   * Maximum height of the textarea.
   * @default undefined
   */
  maxHeight?: number;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, minHeight = "min-h-[80px]", maxHeight, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge forwarded ref with local ref
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // Auto-resize logic
    React.useEffect(() => {
      if (!autoResize || !innerRef.current) return;

      const textarea = innerRef.current;

      const resize = () => {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight + 10, maxHeight || Infinity) + "px";
      };

      resize();

      textarea.addEventListener("input", resize);

      return () => {
        textarea.removeEventListener("input", resize);
      };
    }, [autoResize, props.value]);

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          autoResize ? "" : minHeight,
          className
        )}
        ref={innerRef}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea"

export { Textarea }
