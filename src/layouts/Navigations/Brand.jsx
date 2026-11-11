export default function Brand({ light = false, className = "h-7" }) {
  return (
    <img
      src={light ? "/logo.webp" : "/logo.webp"}
      alt="Wakastore"
      className={"w-auto " + className}
    />
  );
}