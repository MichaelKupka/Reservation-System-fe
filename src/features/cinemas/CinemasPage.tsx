import { ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { allPages } from "../../shared/api/client";
import type { Cinema } from "../../shared/api/types";
import { useAsync } from "../../shared/lib/hooks";
import { Empty, ErrorState, Loading, PageHeading } from "../../shared/ui/index";

export default function Cinemas() {
  const data = useAsync((signal) => allPages<Cinema>("/cinemas", signal));
  return (
    <div className="container inner-page">
      <PageHeading eyebrow="BLÍZKO K VÁM" title="Naše kiná">
        Nájdite miesto, kde si príbehy užijete naplno.
      </PageHeading>
      {data.loading ? (
        <Loading />
      ) : data.error ? (
        <ErrorState error={data.error} retry={data.reload} />
      ) : !data.value?.length ? (
        <Empty title="Pripravujeme miesta pre nové príbehy." action={false}>
          Ponuku kín čoskoro doplníme.
        </Empty>
      ) : (
        <div className="cinema-grid gap-6.5 grid">
          {data.value.map((cinema, index) => (
            <article className="cinema-card" key={cinema.id}>
              <div className="cinema-illustration flex-col items-center flex relative">
                <div className="cinema-screen" />
                <div className="cinema-chair-row gap-3 flex">
                  {Array.from({ length: 7 }, (_, i) => (
                    <i key={i} />
                  ))}
                </div>
                <div className="cinema-chair-row gap-3 flex rear">
                  {Array.from({ length: 7 }, (_, i) => (
                    <i key={i} />
                  ))}
                </div>
                <span>
                  EST. KINO KLUB / {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="cinema-card-body">
                <h2>{cinema.name}</h2>
                <p>
                  <MapPin size={17} />
                  {cinema.address}
                </p>
                <Link className="btn secondary" to={`/?kino=${cinema.id}`}>
                  Program tohto kina <ArrowUpRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
