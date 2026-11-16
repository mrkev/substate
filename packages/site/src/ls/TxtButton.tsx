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
      className={twMerge("border-0 p-0 text-gray-500 hover:underline", className)}
      style={{
        background: "none",
        ...style,
      }}
      {...rest}
    />
  );
}
