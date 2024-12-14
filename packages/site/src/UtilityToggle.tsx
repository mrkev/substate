export function UtilityToggle({
  className,
  style: styleArg,
  toggleStyle = { background: "SaddleBrown" },
  toggled,
  onToggle: onToggle,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  toggleStyle?: React.CSSProperties;
  toggled: boolean;
  onToggle: (toggled: boolean) => void;
  title: string | null;
}) {
  const style = toggled ? { ...styleArg, ...toggleStyle } : styleArg;
  return (
    <button
      className={className}
      style={style}
      {...props}
      onClick={function (e) {
        onToggle(!toggled);
        e.stopPropagation();
      }}
    />
  );
}
