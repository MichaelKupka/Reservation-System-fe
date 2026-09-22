import { filmArtwork } from "../lib/artwork";
export function Poster({
  title = "",
  hero = false,
}: {
  title?: string;
  hero?: boolean;
}) {
  return (
    <div className={`poster ${hero ? "hero-poster" : ""}`} aria-hidden="true">
      <img src={filmArtwork(title)} alt="" loading={hero ? "eager" : "lazy"} />
      {title && (
        <div className="poster-type">
          <span>KINO KLUB UVÁDZA</span>
          <strong>{title}</strong>
          <span>ZAŽITE PRÍBEH NA VEĽKOM PLÁTNE</span>
        </div>
      )}
    </div>
  );
}
