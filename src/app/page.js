import Image from "next/image";
import InstagramIcon from "@mui/icons-material/Instagram";
import { FaTiktok } from "react-icons/fa";
import HomeCtas, { FooterAccessLink } from "@/components/home/HomeCtas";
import heroImage from "@/assets/images/Hero.jpg";
import datosImage from "@/assets/images/Datos.jpg";
import tachosImage from "@/assets/images/Tachos.jpg";

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
                <p className="mb-3 inline-flex rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary shadow-sm sm:mb-4 sm:px-4 sm:text-xs">
                  Educacion ambiental
                </p>
                <h1 className="text-balance text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                  Gamifica el reciclaje y convierte cada clase en una mision sostenible
                </h1>
                <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-6 sm:text-base lg:text-lg">
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
              <p className="mt-3 text-sm text-pretty text-muted-foreground sm:mt-4 sm:text-base">
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
                    className={`mb-3 inline-flex w-fit rounded-xl px-3 py-1 text-[11px] font-bold sm:mb-4 sm:rounded-2xl sm:text-xs ${card.accent}`}
                  >
                    EcoURP
                  </span>
                  <h3 className="text-base font-semibold text-foreground sm:text-lg">{card.title}</h3>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground sm:mt-3 sm:text-sm">
                    {card.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="separacion"
          className="scroll-mt-20 border-t border-border bg-surface-raised/60 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16"
        >
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-14">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-eco-emerald-100 to-eco-lime-100 p-6 shadow-inner sm:rounded-3xl sm:p-8 lg:p-10">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl">
                  Separación en origen
                </h2>
                <p className="mt-3 text-sm text-muted-foreground sm:mt-4 sm:text-base">
                  Separar en casa o en la universidad es el primer paso para que papel, vidrio,
                  metal y plastico lleguen limpios a las plantas. Consulta siempre las normas del
                  distrito: los colores del contenedor pueden variar y la confusion contamina el
                  lote.
                </p>
              </div>
              <div className="space-y-5 rounded-2xl border border-border bg-surface-raised/60 p-5 sm:space-y-6 sm:rounded-3xl sm:p-8 lg:p-10">
                <div className="overflow-hidden rounded-xl border border-border bg-card/80 sm:rounded-2xl">
                  <div className="relative aspect-[16/10] w-full">
                    <Image
                      src={tachosImage}
                      alt="Tachos de reciclaje por colores en un punto de separacion"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 520px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-eco-emerald-600/15" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground sm:text-lg">Tips rápidos</h3>
                <ul className="space-y-3 text-sm text-muted-foreground sm:space-y-4">
                  <li className="flex gap-3 rounded-xl bg-card/80 p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-xs font-bold text-eco-emerald-900 sm:h-8 sm:w-8 sm:text-sm">
                      1
                    </span>
                    <span className="text-xs leading-relaxed sm:text-sm">
                      El papel con restos de comida (como cajas de pizza) no se recicla: puede
                      contaminar todo el lote. En tu juego va al tacho organico o general.
                    </span>
                  </li>
                  <li className="flex gap-3 rounded-xl bg-card/80 p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-xs font-bold text-eco-emerald-900 sm:h-8 sm:w-8 sm:text-sm">
                      2
                    </span>
                    <span className="text-xs leading-relaxed sm:text-sm">
                      El vidrio es 100% reciclable y puede procesarse infinitas veces sin perder
                      calidad, pero mezclarlo con plastico dificulta su limpieza.
                    </span>
                  </li>
                  <li className="flex gap-3 rounded-xl bg-card/80 p-3 shadow-sm sm:rounded-2xl sm:p-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-eco-lime-300 text-xs font-bold text-eco-emerald-900 sm:h-8 sm:w-8 sm:text-sm">
                      3
                    </span>
                    <span className="text-xs leading-relaxed sm:text-sm">
                      Los plasticos en el tacho organico no se descomponen: terminan como
                      microplasticos en el suelo. Separarlos bien evita esa contaminacion.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
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
