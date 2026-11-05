import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

// Botones de 85 BARBERÍA: esquinas afiladas, mayúsculas con tracking amplio,
// ámbar como único acento. Ver docs/02-diseno.md.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-[3px] border border-transparent text-[0.8125rem] leading-none font-semibold tracking-[0.12em] whitespace-nowrap uppercase transition-[transform,background-color,color,border-color] duration-200 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-300",
        outline:
          "border-bone/35 bg-transparent text-foreground hover:border-primary hover:text-brand-300 aria-expanded:border-primary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-ink-700",
        ghost:
          "text-muted-foreground hover:bg-ink-800 hover:text-foreground aria-expanded:bg-ink-800 aria-expanded:text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/15 text-destructive hover:bg-destructive/25",
        link: "text-primary tracking-normal normal-case underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6",
        xs: "h-7 px-2.5 text-[0.7rem]",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

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
  )
}

export { Button, buttonVariants }
