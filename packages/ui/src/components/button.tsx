import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@calma/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding font-sans text-[18px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Amber fill. The one obvious action on a screen.
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        // "Not now" / "Skip". Never greyed out, never smaller, never delayed —
        // dismissals are equal in weight to the primary action.
        quiet: "text-muted-foreground hover:bg-accent hover:text-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        // CLAY, NOT RED. Calma has no error states — nothing here is a failure,
        // and a red alert shown to an anxious person is a small act of harm.
        destructive:
          "bg-clay/10 text-clay-foreground hover:bg-clay/20 focus-visible:border-clay/40 focus-visible:ring-clay/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[46px] gap-2 px-[18px]",   /* pill — the most repeated dimension */
        xs: "h-8 gap-1 px-3 text-[13px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-10 gap-1.5 px-4 text-[15px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-[62px] gap-2 px-6",             /* primary button */
        icon: "size-[46px] rounded-full",
        "icon-xs": "size-8 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10 rounded-full",
        "icon-lg": "size-[62px] rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
