export default function WakastoreLogo({ light = false, large = false }) {
  return (
    <img
      className={`logo.webp${light ? " logo.webp-light" : ""}${large ? "logo.webp-large" : ""}`}
      src="/logo.webp"
      alt="wakastore"
      width="150"
      height="42"
    />
  );
}
