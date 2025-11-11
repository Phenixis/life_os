import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  /**
   * If true, the textarea will automatically resize based on its content.
   * @default true
   */
  autoResize?: boolean;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = true, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

    // Merge forwarded ref with local ref
    React.useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

    // Auto-resize logic
    React.useEffect(() => {
      if (!autoResize || !innerRef.current) return;

      const textarea = innerRef.current;

      const resize = () => {
        textarea.style.height = "auto";
        textarea.style.height = (textarea.scrollHeight + 10) + "px";
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
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
