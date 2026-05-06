"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type AuthMode = "login" | "signup" | "reset";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type TouchedFields = {
  email: boolean;
  password: boolean;
  confirmPassword: boolean;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_EMAIL_COOLDOWN_MS = 60_000;

function getAuthErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return "No se pudo completar la solicitud. Intenta nuevamente.";
}

function getAuthErrorCode(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return "";
}

function getAuthErrorStatus(error: unknown): number | undefined {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  return undefined;
}

function isEmailRateLimitError(error: unknown): boolean {
  const message = getAuthErrorMessage(error).toLowerCase();
  const code = getAuthErrorCode(error).toLowerCase();
  const status = getAuthErrorStatus(error);

  return (
    code === "over_email_send_rate_limit" ||
    status === 429 ||
    message.includes("email rate limit") ||
    message.includes("rate limit") ||
    message.includes("too many requests") ||
    message.includes("security purposes")
  );
}

function getRetryAfterMs(errorMessage: string): number {
  const secondMatch = errorMessage.match(/(\d+)\s*second/i);
  if (secondMatch) {
    return Number(secondMatch[1]) * 1000;
  }

  const minuteMatch = errorMessage.match(/(\d+)\s*minute/i);
  if (minuteMatch) {
    return Number(minuteMatch[1]) * 60_000;
  }

  return AUTH_EMAIL_COOLDOWN_MS;
}

function getCooldownKey(flow: "signup" | "reset", email: string): string {
  return `ecourp_auth_${flow}_${email.toLowerCase()}`;
}

function getRemainingCooldownMs(flow: "signup" | "reset", email: string): number {
  if (typeof window === "undefined") return 0;

  const rawValue = window.sessionStorage.getItem(getCooldownKey(flow, email));
  const lastAttemptMs = rawValue ? Number(rawValue) : NaN;
  if (!Number.isFinite(lastAttemptMs)) {
    return 0;
  }

  const elapsedMs = Date.now() - lastAttemptMs;
  if (elapsedMs >= AUTH_EMAIL_COOLDOWN_MS) {
    return 0;
  }

  return AUTH_EMAIL_COOLDOWN_MS - elapsedMs;
}

function saveCooldown(flow: "signup" | "reset", email: string): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(getCooldownKey(flow, email), String(Date.now()));
}

function formatRateLimitMessage(waitMs: number): string {
  const seconds = Math.max(1, Math.ceil(waitMs / 1000));
  return `Demasiados correos enviados. Espera ${seconds} segundos e intenta de nuevo.`;
}

function OrganicBlob({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 620"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M104 320C88 250 106 155 173 108C240 61 343 62 434 77C518 90 597 132 621 204C646 275 615 362 560 431C505 500 425 548 337 559C249 570 149 546 111 474C73 402 120 390 104 320Z"
        fill="#c8ecd8"
      />
      <path
        d="M186 175C230 124 308 105 385 117C463 129 529 171 545 240C561 309 527 392 465 440C404 488 315 500 241 474C167 448 108 384 113 309C118 235 142 226 186 175Z"
        fill="#d8f3e3"
        opacity="0.6"
      />
    </svg>
  );
}

function RecyclingIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 390"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="groundShade" x1="280" y1="286" x2="280" y2="344" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c8ecd8" />
          <stop offset="1" stopColor="#a2d7b8" />
        </linearGradient>
        <linearGradient id="shirtLeft" x1="58" y1="44" x2="58" y2="123" gradientUnits="userSpaceOnUse">
          <stop stopColor="#35b47a" />
          <stop offset="1" stopColor="#238a5a" />
        </linearGradient>
        <linearGradient id="shirtRight" x1="46" y1="52" x2="46" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#50c0a1" />
          <stop offset="1" stopColor="#2b8b72" />
        </linearGradient>
      </defs>

      <ellipse cx="280" cy="334" rx="203" ry="34" fill="#b8dfc4" />
      <path d="M98 313C176 298 372 298 462 311V335H98V313Z" fill="url(#groundShade)" />
      <path d="M96 309C169 293 378 294 463 309" stroke="#7eb691" strokeWidth="6" strokeLinecap="round" />

      <g opacity="0.7">
        <path d="M123 296C131 286 149 286 156 296" stroke="#5a9f79" strokeWidth="4" strokeLinecap="round" />
        <path d="M404 295C412 286 429 286 436 295" stroke="#5a9f79" strokeWidth="4" strokeLinecap="round" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0;0 -2;0 0"
          dur="5.8s"
          repeatCount="indefinite"
        />

        <g transform="translate(148 168)">
          <rect x="0" y="0" width="54" height="112" rx="11" fill="#4f9df9" />
          <rect x="-5" y="-14" width="64" height="16" rx="8" fill="#2f7bd2" />
          <rect x="20" y="18" width="15" height="9" rx="4.5" fill="#d8ecff" />
          <path d="M21 47H33L28 39L31 34H22L25 30L15 40H24L21 47Z" fill="#e9f5ff" />
          <text x="27" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#f7fbff">
            PLA
          </text>
          <circle cx="12" cy="109" r="5" fill="#1f5fa8" />
          <circle cx="42" cy="109" r="5" fill="#1f5fa8" />
        </g>

        <g transform="translate(218 168)">
          <rect x="0" y="0" width="54" height="112" rx="11" fill="#f6c744" />
          <rect x="-5" y="-14" width="64" height="16" rx="8" fill="#dfa81f" />
          <rect x="20" y="18" width="15" height="9" rx="4.5" fill="#fff6d8" />
          <path d="M24 36H31L28 31L30 27H24L26 23L19 30H24V36Z" fill="#fff9eb" />
          <path d="M30 50H37L34 45L36 41H30L32 37L25 44H30V50Z" fill="#fff9eb" />
          <text x="27" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fffcf2">
            PAP
          </text>
          <circle cx="12" cy="109" r="5" fill="#b07d10" />
          <circle cx="42" cy="109" r="5" fill="#b07d10" />
        </g>

        <g transform="translate(288 168)">
          <rect x="0" y="0" width="54" height="112" rx="11" fill="#4bbf7d" />
          <rect x="-5" y="-14" width="64" height="16" rx="8" fill="#2f9b5f" />
          <rect x="20" y="18" width="15" height="9" rx="4.5" fill="#daf6e7" />
          <path d="M25 46C25 38 34 35 38 40C42 45 38 55 30 56C26 53 25 49 25 46Z" fill="#e7fbef" />
          <path d="M33 42L28 50" stroke="#7fcaa0" strokeWidth="2" strokeLinecap="round" />
          <text x="27" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#effdf6">
            VID
          </text>
          <circle cx="12" cy="109" r="5" fill="#237047" />
          <circle cx="42" cy="109" r="5" fill="#237047" />
        </g>

        <g transform="translate(358 168)">
          <rect x="0" y="0" width="54" height="112" rx="11" fill="#bb7f35" />
          <rect x="-5" y="-14" width="64" height="16" rx="8" fill="#945f20" />
          <rect x="20" y="18" width="15" height="9" rx="4.5" fill="#f6e7d2" />
          <path d="M25 44C30 40 35 38 39 43C36 50 31 53 24 51C22 48 23 46 25 44Z" fill="#f9ead6" />
          <path d="M34 44L29 48" stroke="#d8be98" strokeWidth="2" strokeLinecap="round" />
          <text x="27" y="74" textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff7ef">
            ORG
          </text>
          <circle cx="12" cy="109" r="5" fill="#724717" />
          <circle cx="42" cy="109" r="5" fill="#724717" />
        </g>
      </g>

      <g transform="translate(78 126)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="78 126;78 123;78 126"
          dur="3.2s"
          repeatCount="indefinite"
        />
        <g transform="translate(5 12) scale(0.9)">
          <ellipse cx="54" cy="146" rx="24" ry="6" fill="#9dcbb0" opacity="0.35" />
          <circle cx="52" cy="30" r="17" fill="#f8c48b" />
          <path d="M37 24C39 12 52 8 64 15C67 17 70 20 70 24C66 28 60 29 55 28C48 27 42 26 37 24Z" fill="#2a5441" />
          <circle cx="47" cy="30" r="1.6" fill="#18382b" />
          <circle cx="56" cy="30" r="1.6" fill="#18382b" />
          <path d="M47 36C49 38 53 38 56 36" stroke="#915f3b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M18 73C18 52 33 40 53 40C71 40 86 52 86 70V118H18V73Z" fill="url(#shirtLeft)" />
          <path d="M18 80H86" stroke="#2fd387" strokeWidth="3" opacity="0.6" />
          <rect x="24" y="82" width="13" height="18" rx="4" fill="#d6f7e5" opacity="0.8" />
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 114 65;4 114 65;0 114 65"
              dur="4.8s"
              repeatCount="indefinite"
            />
            <path d="M86 78L108 66" stroke="#1f5f42" strokeWidth="6" strokeLinecap="round" />
            <rect x="105" y="59" width="17" height="13" rx="3" fill="#f6c744" />
          </g>
          <rect x="30" y="118" width="21" height="27" rx="8" fill="#1f7f54" />
          <rect x="53" y="118" width="21" height="27" rx="8" fill="#207a53" />
          <rect x="27" y="142" width="27" height="9" rx="4.5" fill="#235e44" />
          <rect x="51" y="142" width="27" height="9" rx="4.5" fill="#235e44" />
        </g>
      </g>

      <g transform="translate(386 132)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="386 132;386 129;386 132"
          dur="3.6s"
          repeatCount="indefinite"
        />
        <g transform="translate(5 12) scale(0.9)">
          <ellipse cx="46" cy="145" rx="24" ry="6" fill="#9dcbb0" opacity="0.35" />
          <circle cx="44" cy="32" r="17" fill="#f8c48b" />
          <path d="M29 30C31 18 43 11 55 15C62 17 67 22 68 29C61 33 52 34 44 33C39 32 34 31 29 30Z" fill="#285242" />
          <circle cx="39" cy="33" r="1.6" fill="#17372a" />
          <circle cx="48" cy="33" r="1.6" fill="#17372a" />
          <path d="M39 39C41 41 45 41 48 39" stroke="#8f5e3b" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M12 77C12 56 27 44 47 44C66 44 80 56 80 74V121H12V77Z" fill="url(#shirtRight)" />
          <path d="M12 84H80" stroke="#74d7bc" strokeWidth="3" opacity="0.65" />
          <rect x="17" y="86" width="12" height="16" rx="4" fill="#dcf9ee" opacity="0.85" />
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="0 -16 70;-4 -16 70;0 -16 70"
              dur="5.1s"
              repeatCount="indefinite"
            />
            <path d="M14 81L-8 70" stroke="#225f49" strokeWidth="6" strokeLinecap="round" />
            <rect x="-24" y="64" width="16" height="12" rx="3" fill="#4f9df9" />
          </g>
          <rect x="24" y="121" width="20" height="25" rx="8" fill="#2e866f" />
          <rect x="46" y="121" width="20" height="25" rx="8" fill="#2e826f" />
          <rect x="21" y="142" width="26" height="9" rx="4.5" fill="#215849" />
          <rect x="44" y="142" width="26" height="9" rx="4.5" fill="#215849" />
        </g>
      </g>

      <g transform="translate(258 154)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="258 154;258 151;258 154"
          dur="3.1s"
          repeatCount="indefinite"
        />
        <ellipse cx="24" cy="138" rx="16" ry="5" fill="#9dcbb0" opacity="0.35" />
        <circle cx="22" cy="44" r="12" fill="#f8c48b" />
        <path d="M11 41C12 33 20 30 28 34C31 35 34 38 34 41C29 44 21 45 11 41Z" fill="#2b5441" />
        <rect x="6" y="56" width="33" height="50" rx="12" fill="#3aa982" />
        <rect x="8" y="64" width="29" height="4" rx="2" fill="#71d3b2" opacity="0.6" />
        <path d="M39 70L56 64" stroke="#1f5f42" strokeWidth="5" strokeLinecap="round" />
        <path d="M56 59L64 64L56 69Z" fill="#4bbf7d" />
        <rect x="11" y="105" width="11" height="24" rx="5" fill="#227854" />
        <rect x="24" y="105" width="11" height="24" rx="5" fill="#227854" />
        <rect x="9" y="127" width="14" height="8" rx="4" fill="#1f5f44" />
        <rect x="23" y="127" width="14" height="8" rx="4" fill="#1f5f44" />
      </g>

      <g opacity="0.88">
        <g>
          <path d="M224 141C224 134 231 131 235 135C238 139 235 146 228 147C225 145 224 143 224 141Z" fill="#4f9df9" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -5;0 0"
            dur="4s"
            repeatCount="indefinite"
          />
        </g>
        <g>
          <path d="M286 127C291 122 299 123 301 130C299 136 293 139 286 137C283 133 283 130 286 127Z" fill="#4bbf7d" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -6;0 0"
            dur="4.4s"
            repeatCount="indefinite"
          />
        </g>
        <g>
          <path d="M332 139L346 130L359 139L346 148L332 139Z" fill="#f6c744" />
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0;0 -4;0 0"
            dur="3.8s"
            repeatCount="indefinite"
          />
        </g>
      </g>

      <g>
        <circle cx="190" cy="119" r="4" fill="#ffffff" opacity="0.75">
          <animate attributeName="opacity" values="0.25;0.95;0.25" dur="3.6s" repeatCount="indefinite" />
        </circle>
        <circle cx="368" cy="114" r="3.5" fill="#ffffff" opacity="0.7">
          <animate attributeName="opacity" values="0.3;0.9;0.3" dur="4.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="277" cy="98" r="3" fill="#ffffff" opacity="0.7">
          <animate attributeName="opacity" values="0.3;0.85;0.3" dur="3.1s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}

function firstError(errors: FieldErrors): string {
  return errors.email || errors.password || errors.confirmPassword || "";
}

function validateFields(
  mode: AuthMode,
  emailValue: string,
  passwordValue: string,
  confirmPasswordValue: string
): FieldErrors {
  const errors: FieldErrors = {};
  const emailTrim = emailValue.trim();

  if (!emailTrim || !EMAIL_PATTERN.test(emailTrim)) {
    errors.email = "Ingresa un correo valido.";
  }

  if (mode !== "reset") {
    if (!passwordValue) {
      errors.password = "Ingresa tu contrasena.";
    } else if (passwordValue.length < 6) {
      errors.password = "La contrasena debe tener al menos 6 caracteres.";
    }
  }

  if (mode === "signup") {
    if (!confirmPasswordValue) {
      errors.confirmPassword = "Repite tu contrasena.";
    } else if (passwordValue !== confirmPasswordValue) {
      errors.confirmPassword = "Las contrasenas no coinciden.";
    }
  }

  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [serverError, setServerError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [pendingUserId, setPendingUserId] = useState("");

  const isReset = mode === "reset";
  const isSignup = mode === "signup";
  const touchedAny = touched.email || touched.password || touched.confirmPassword;

  const modeDescription = useMemo(() => {
    if (isReset) {
      return "Te enviaremos un enlace para recuperar tu acceso.";
    }
    if (isSignup) {
      return "Crea tu cuenta EcoURP para empezar a reciclar con retos.";
    }
    return "Ingresa con el correo y contrasena de tu cuenta EcoURP.";
  }, [isReset, isSignup]);

  const inlineError = useMemo(() => {
    if (serverError) return serverError;
    if (!attemptedSubmit && !touchedAny) return "";
    return firstError(fieldErrors);
  }, [serverError, attemptedSubmit, touchedAny, fieldErrors]);

  function refreshValidation(
    nextMode: AuthMode,
    nextEmail: string,
    nextPassword: string,
    nextConfirmPassword: string
  ) {
    const nextErrors = validateFields(nextMode, nextEmail, nextPassword, nextConfirmPassword);
    setFieldErrors(nextErrors);
    return nextErrors;
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setServerError("");
    setAttemptedSubmit(false);
    setFieldErrors({});
    setTouched({ email: false, password: false, confirmPassword: false });

    if (nextMode === "reset") {
      setPassword("");
      setConfirmPassword("");
      return;
    }

    if (nextMode === "login") {
      setConfirmPassword("");
    }
  }

  function closeProfilePrompt() {
    setProfilePromptOpen(false);
    setProfileName("");
    setPendingUserId("");
  }

  function completeSignupFlow() {
    closeProfilePrompt();
    setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
    setMode("login");
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    setTouched({ email: false, password: false, confirmPassword: false });
    setAttemptedSubmit(false);
  }

  function onEmailChange(value: string) {
    setEmail(value);
    setMessage("");
    setServerError("");
    if (attemptedSubmit || touchedAny) {
      refreshValidation(mode, value, password, confirmPassword);
    }
  }

  function onPasswordChange(value: string) {
    setPassword(value);
    setMessage("");
    setServerError("");
    if (attemptedSubmit || touchedAny) {
      refreshValidation(mode, email, value, confirmPassword);
    }
  }

  function onConfirmPasswordChange(value: string) {
    setConfirmPassword(value);
    setMessage("");
    setServerError("");
    if (attemptedSubmit || touchedAny) {
      refreshValidation(mode, email, password, value);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setMessage("");
    setServerError("");
    setAttemptedSubmit(true);

    const errors = refreshValidation(mode, email, password, confirmPassword);
    if (firstError(errors)) {
      return;
    }

    if (!supabase) {
      setServerError(
        "Supabase no esta configurado. Anade NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en .env.local."
      );
      return;
    }

    const emailTrim = email.trim();

    setLoading(true);
    try {
      if (isReset) {
        const resetCooldownMs = getRemainingCooldownMs("reset", emailTrim);
        if (resetCooldownMs > 0) {
          setServerError(formatRateLimitMessage(resetCooldownMs));
          return;
        }

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(emailTrim, {
          redirectTo:
            typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
        });

        if (resetError) {
          if (isEmailRateLimitError(resetError)) {
            const waitMs = getRetryAfterMs(getAuthErrorMessage(resetError));
            saveCooldown("reset", emailTrim);
            setServerError(formatRateLimitMessage(waitMs));
            return;
          }

          setServerError(getAuthErrorMessage(resetError));
          return;
        }

        saveCooldown("reset", emailTrim);
        setMessage("Te enviamos un correo para restablecer tu contrasena.");
        return;
      }

      if (isSignup) {
        const signupCooldownMs = getRemainingCooldownMs("signup", emailTrim);
        if (signupCooldownMs > 0) {
          setServerError(formatRateLimitMessage(signupCooldownMs));
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailTrim,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? `${window.location.origin}/login` : undefined,
          },
        });

        if (signUpError) {
          if (isEmailRateLimitError(signUpError)) {
            const waitMs = getRetryAfterMs(getAuthErrorMessage(signUpError));
            saveCooldown("signup", emailTrim);
            setServerError(formatRateLimitMessage(waitMs));
            return;
          }

          setServerError(getAuthErrorMessage(signUpError));
          return;
        }

        saveCooldown("signup", emailTrim);
        if (data?.user?.id) {
          setPendingUserId(data.user.id);
          setProfilePromptOpen(true);
        } else {
          setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso.");
          setMode("login");
        }
        return;
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password,
      });

      if (authError) {
        setServerError(
          authError.message === "Invalid login credentials"
            ? "Correo o contrasena incorrectos."
            : authError.message
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("ecourp_login_toast", "1");
      }

      router.push(nextUrl || "/");
      router.refresh();
    } catch {
      setServerError("No se pudo completar la solicitud. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="relative hidden overflow-hidden bg-surface-raised md:flex md:w-2/5 lg:w-1/2">
          <div
            className="decor-circle absolute -left-8 top-16 h-24 w-24 rounded-full bg-primary/15"
            style={{ animationDelay: "0s", animationDuration: "8.6s" }}
          />
          <div
            className="decor-circle absolute right-10 top-10 h-14 w-14 rounded-full bg-primary/10"
            style={{ animationDelay: "0.9s", animationDuration: "7.7s" }}
          />
          <div
            className="decor-circle absolute bottom-16 left-14 h-20 w-20 rounded-full bg-primary/15"
            style={{ animationDelay: "1.6s", animationDuration: "8.9s" }}
          />
          <div
            className="decor-circle absolute right-6 top-1/3 h-28 w-28 rounded-full bg-primary/10"
            style={{ animationDelay: "0.5s", animationDuration: "9.4s" }}
          />
          <div
            className="decor-circle absolute bottom-28 right-20 h-16 w-16 rounded-full bg-primary/15"
            style={{ animationDelay: "2.1s", animationDuration: "7.4s" }}
          />
          <div
            className="decor-circle absolute left-1/3 top-1/2 h-10 w-10 rounded-full bg-primary/10"
            style={{ animationDelay: "1.2s", animationDuration: "8.1s" }}
          />

          <div className="relative z-10 flex w-full flex-col px-8 py-8 lg:px-10">
            <div className="flex items-center gap-3 text-foreground">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-xl font-black text-primary-foreground">
                E
              </div>
              <span className="text-lg font-semibold tracking-wide text-foreground">EcoURP</span>
            </div>

            <div className="mt-8 flex flex-1 items-center justify-center md:mt-4">
              <div className="relative w-full max-w-[360px] md:max-w-[330px] lg:max-w-[520px]">
                <OrganicBlob className="blob-float h-full w-full" />
                <div className="absolute inset-[14%] overflow-hidden rounded-[26%] ring-1 ring-border/40 shadow-[0_18px_28px_rgba(6,46,28,0.18)]">
                  <RecyclingIllustration className="illustration-float h-full w-full" />
                  <div className="illustration-gloss" aria-hidden="true" />
                </div>
              </div>
            </div>

            <p className="mt-6 max-w-xs text-sm font-medium leading-relaxed text-muted-foreground">
              Aprende a reciclar. Salva el planeta.
            </p>
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center bg-background px-5 py-8 sm:px-8 md:w-3/5 md:px-10 lg:w-1/2 lg:px-14">
          <div className="w-full max-w-[480px]">
            <div className="mb-6 flex items-center gap-3 md:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-black text-primary-foreground">
                E
              </div>
              <span className="text-base font-semibold tracking-wide text-foreground">EcoURP</span>
            </div>

            <div className="rounded-[30px] border border-border bg-card p-6 shadow-[0_20px_45px_rgba(13,43,26,0.08)] sm:p-9">
              <div className="mb-7 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground">
                  E
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Bienvenido de nuevo
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{modeDescription}</p>
              </div>

              {!supabase ? (
                <div
                  className="rounded-2xl border border-amber-300/50 bg-amber-500/10 px-4 py-4 text-sm text-amber-700"
                  role="alert"
                >
                  <p className="font-semibold">Configuracion pendiente</p>
                  <p className="mt-2">
                    Crea un archivo .env.local con NEXT_PUBLIC_SUPABASE_URL y
                    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-raised p-1.5">
                    {(
                      [
                        { value: "login", label: "Ingresar" },
                        { value: "signup", label: "Crear cuenta" },
                        { value: "reset", label: "Recuperar" },
                      ] as const
                    ).map((tab) => {
                      const active = mode === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          onClick={() => switchMode(tab.value)}
                          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-300 sm:text-sm ${
                            active
                              ? "bg-card text-primary shadow-[0_6px_14px_rgba(26,92,58,0.12)]"
                              : "text-muted-foreground hover:bg-card/70"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isReset ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <p className="overflow-hidden text-sm text-muted-foreground">
                      Ingresa tu correo para enviarte el enlace de recuperacion.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Correo electronico
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => onEmailChange(event.target.value)}
                      onBlur={() => {
                        setTouched((prev) => ({ ...prev, email: true }));
                        refreshValidation(mode, email, password, confirmPassword);
                      }}
                      className="mt-2 w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                      placeholder="tu@correo.com"
                      required
                    />
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isReset
                        ? "grid-rows-[0fr] -translate-y-1 opacity-0"
                        : "grid-rows-[1fr] translate-y-0 opacity-100"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <label htmlFor="password" className="text-sm font-medium text-foreground">
                        Contrasena
                      </label>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isSignup ? "new-password" : "current-password"}
                        value={password}
                        onChange={(event) => onPasswordChange(event.target.value)}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, password: true }));
                          refreshValidation(mode, email, password, confirmPassword);
                        }}
                        className="mt-2 w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                        placeholder="********"
                        required={!isReset}
                      />
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isSignup
                        ? "grid-rows-[1fr] translate-y-0 opacity-100"
                        : "grid-rows-[0fr] -translate-y-1 opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <label htmlFor="confirm" className="text-sm font-medium text-foreground">
                        Repite la contrasena
                      </label>
                      <input
                        id="confirm"
                        name="confirm"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => onConfirmPasswordChange(event.target.value)}
                        onBlur={() => {
                          setTouched((prev) => ({ ...prev, confirmPassword: true }));
                          refreshValidation(mode, email, password, confirmPassword);
                        }}
                        className="mt-2 w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                        placeholder="********"
                        required={isSignup}
                      />
                    </div>
                  </div>

                  {message ? (
                    <p
                      className="rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
                      role="status"
                    >
                      {message}
                    </p>
                  ) : null}

                  {inlineError ? (
                    <p className="rounded-xl border border-rose-300/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-600" role="alert">
                      {inlineError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-1 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading
                      ? "Procesando..."
                      : isReset
                      ? "Enviar enlace"
                      : isSignup
                      ? "Crear cuenta"
                      : "Iniciar sesion"}
                  </button>

                  <p className="pt-1 text-center text-sm text-muted-foreground">
                    Necesitas ayuda para acceder?{" "}
                    <a
                      href="mailto:soporte@ecourp.pe"
                      className="font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Contactar soporte
                    </a>
                  </p>
                </form>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
              Al continuar, aceptas el uso de autenticacion segura proporcionada por Supabase.
            </p>
          </div>
        </main>
      </div>

      {profilePromptOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Elige tu nombre de perfil</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Este nombre aparecera en la plataforma.
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={completeSignupFlow}
                className="flex h-8 w-8 items-center justify-center rounded-full text-primary transition hover:bg-surface-raised"
              >
                x
              </button>
            </div>

            <label
              htmlFor="profileName"
              className="mt-4 block text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Nombre para mostrar
            </label>
            <input
              id="profileName"
              type="text"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ej: Ana, Equipo Verde"
              className="mt-2 w-full rounded-2xl border border-border bg-surface-raised px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={completeSignupFlow}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-raised"
              >
                Omitir
              </button>
              <button
                type="button"
                disabled={profileSaving}
                onClick={async () => {
                  if (!supabase || !pendingUserId) return;

                  setProfileSaving(true);
                  const { error: profileError } = await supabase.from("profiles").upsert({
                    id: pendingUserId,
                    display_name: profileName.trim() || null,
                  });
                  setProfileSaving(false);

                  if (profileError) {
                    setServerError("No se pudo guardar el nombre de perfil.");
                    return;
                  }

                  completeSignupFlow();
                }}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {profileSaving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .blob-float {
          animation: ecoBlobFloat 9s ease-in-out infinite;
          transform-origin: 52% 48%;
        }

        .decor-circle {
          animation-name: ecoCirclePulse;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          transform-origin: center;
        }

        .illustration-float {
          animation: ecoIllustrationDrift 7.4s ease-in-out infinite;
          transform-origin: 50% 64%;
        }

        .illustration-gloss {
          position: absolute;
          inset: -18% -34%;
          pointer-events: none;
          background: linear-gradient(100deg, transparent 32%, rgba(255, 255, 255, 0.34) 50%, transparent 67%);
          mix-blend-mode: screen;
          opacity: 0.22;
          animation: ecoGlossSweep 7.2s ease-in-out infinite;
        }

        @keyframes ecoBlobFloat {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-11px) rotate(1deg);
          }
        }

        @keyframes ecoCirclePulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.2;
          }
          50% {
            transform: scale(1.13);
            opacity: 0.35;
          }
        }

        @keyframes ecoIllustrationDrift {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes ecoGlossSweep {
          0%,
          18% {
            transform: translateX(-54%) rotate(8deg);
            opacity: 0;
          }
          35% {
            opacity: 0.26;
          }
          58%,
          100% {
            transform: translateX(54%) rotate(8deg);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .blob-float,
          .decor-circle,
          .illustration-float,
          .illustration-gloss {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}