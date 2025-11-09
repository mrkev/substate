import { twMerge } from "tailwind-merge";

export function TxtButton({
  style,
  className,
  ...rest
}: React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>) {
  return (
    <button
      className={twMerge("text-gray-500 hover:underline", className)}
      style={{
        background: "none",
        ...style,
      }}
      {...rest}
    />
  );
}
