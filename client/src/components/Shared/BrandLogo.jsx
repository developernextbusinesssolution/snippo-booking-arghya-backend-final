export const LOGO_URL = "/logo.webp";

export default function BrandLogo({ size = 50, className = "", onClick = null }) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick || undefined}
    >
      <img
        src="/logo.webp"
        alt="Snippo Entertainment"
        className="brand-logo-img"
        style={{ height: size, width: "auto" }}
      />
    </span>
  );
}
