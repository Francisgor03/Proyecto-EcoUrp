import Image from "next/image";
import InstagramIcon from "@mui/icons-material/Instagram";
import { FaTiktok } from "react-icons/fa";
import HomeCtas, { FooterAccessLink } from "@/components/home/HomeCtas";
import SeparationSection from "@/components/home/SeparationSection";
import EcoVillaInfo from "@/components/home/EcoVillaInfo";
import heroImage from "@/assets/images/Hero.jpg";
import datosImage from "@/assets/images/Datos.jpg";

export const metadata = {
  title: "EcoURP | Inicio",
  description:
    "Plataforma educativa sobre reciclaje: aprende, juega y cuida el planeta.",
};


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <main className="flex-1">
        <section className="border-b border-border bg-gradient-to-b from-eco-emerald-100/60 via-eco-emerald-50 to-eco-emerald-50 px-4 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-10">
              <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
                <p className="mb-3 inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary shadow-sm sm:mb-4 sm:px-4 sm:text-sm">
                  Educacion ambiental
                </p>
                <h1 className="text-balance text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                  Gamifica el reciclaje y convierte cada clase en una mision sostenible
                </h1>
                <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg lg:text-lg">
                  EcoURP empodera a la comunidad universitaria con retos, niveles y record para
                  transformar la cultura del reciclaje en una practica cotidiana y divertida con
                  impacto real en el campus y el pais.
                </p>
                <HomeCtas className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center lg:justify-start" />
              </div>
              <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 shadow-lg sm:rounded-3xl">
                <div className="relative aspect-[4/3] w-full sm:aspect-[4/3]">
                  <Image
                    src={heroImage}
                    alt="Estudiantes participando en actividades de reciclaje en el campus"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 520px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-eco-emerald-600/15" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="reciclaje"
          className="scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                ¿Por qué importa el reciclaje?
              </h2>
              <p className="mt-3 text-base text-pretty text-muted-foreground sm:mt-4 sm:text-lg">
                En el Peru se generan cerca de 21,000 toneladas de residuos al dia y solo se
                valoriza el 2.72% de lo que podria reciclarse. Separar bien en el aula y el campus
                reduce la presion sobre los rellenos sanitarios y permite que papel, plastico y
                vidrio regresen a la cadena productiva con menos energia.
              </p>
            </div>

            <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-surface-raised/70 shadow-sm sm:mt-10 sm:rounded-3xl">
              <div className="relative aspect-[16/10] w-full sm:aspect-[16/9]">
                <Image
                  src={datosImage}
                  alt="Infografia con datos de residuos y reciclaje en Peru"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 960px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-eco-emerald-600/15" />
              </div>
            </div>

            <ul className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {[
                {
                  title: "Menos presión al planeta",
                  body: "Conservar recursos locales significa menos extraccion de materias primas. Reciclar una tonelada de papel ahorra el equivalente a 12 arboles y hasta 80% de agua frente a producirlo desde cero.",
                  accent: "bg-eco-emerald-100 text-eco-emerald-800",
                },
                {
                  title: "Comunidades más limpias",
                  body: "Cuando el campus separa bien sus residuos, disminuye la acumulacion en espacios comunes y se mejora la calidad del aire y del suelo para todos.",
                  accent: "bg-eco-lime-200 text-eco-emerald-900",
                },
                {
                  title: "Educación que transforma",
                  body: "La formacion de ciudadania activa crea habitos que se trasladan al hogar y al trabajo. Aprender haciendo genera decisiones responsables y sostenibles.",
                  accent: "bg-eco-emerald-200 text-eco-emerald-900",
                },
              ].map((card) => (
                <li
                  key={card.title}
                  className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-border/60 sm:rounded-3xl sm:p-6"
                >
                  <span
                    className={`mb-3 inline-flex w-fit rounded-xl px-3 py-1 text-[11px] font-bold sm:mb-4 sm:rounded-2xl sm:text-sm ${card.accent}`}
                  >
                    EcoURP
                  </span>
                  <h3 className="text-lg font-semibold text-foreground sm:text-xl">{card.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground sm:mt-3 sm:text-base">
                    {card.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <EcoVillaInfo />

        <SeparationSection />
      </main>

      <footer className="mt-auto border-t border-border bg-surface-raised/70 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left sm:text-sm">
          <p>© {new Date().getFullYear()} EcoURP. Plataforma educativa de reciclaje.</p>
          <FooterAccessLink />
        </div>
        <div className="mx-auto mt-3 flex max-w-6xl flex-wrap items-center justify-center gap-4 text-xs text-foreground sm:mt-4 sm:gap-6 sm:text-sm">
          <a
            className="inline-flex items-center gap-1.5 underline decoration-eco-emerald-400 underline-offset-4 transition hover:text-primary sm:gap-2"
            href="https://www.instagram.com/ecourp9104/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram EcoURP"
          >
            <InstagramIcon className="text-sm sm:text-base" />
            Instagram
          </a>
          <a
            className="inline-flex items-center gap-1.5 underline decoration-eco-emerald-400 underline-offset-4 transition hover:text-primary sm:gap-2"
            href="https://www.tiktok.com/@ecourp6?_r=1&_t=ZS-95XqZQVtulQ"
            target="_blank"
            rel="noreferrer"
            aria-label="TikTok EcoURP"
          >
            <FaTiktok className="text-sm sm:text-base" />
            TikTok
          </a>
        </div>
      </footer>
    </div>
  );
}
