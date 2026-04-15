import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: scores, error } = await supabase
    .from("ecourp_tacho_scores")
    .select("user_id,max_score,updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-sm text-red-700">
        No se pudo cargar la tabla <code>ecourp_tacho_scores</code>: {error.message}
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <p className="p-6 text-sm text-slate-600">No hay puntajes para mostrar.</p>
    );
  }

  return (
    <ul>
      {scores.map((score) => (
        <li key={`${score.user_id}-${score.updated_at}`}>
          {score.max_score}
        </li>
      ))}
    </ul>
  );
}
