export default async function AuthError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const messages: Record<string, string> = {
    OAuthCallbackError: "Google rechazó la conexión. La redirect URI no está configurada.",
    OAuthSignin: "Error iniciando sesión con Google.",
    OAuthCreateAccount: "Error creando la cuenta.",
    Callback: "Error en el callback de autenticación.",
    Default: "Error de autenticación.",
  };

  const message = messages[error || ""] || messages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="flex w-full max-w-sm flex-col gap-6 text-center">
        <div>
          <p className="text-sm font-medium text-text">{message}</p>
          <p className="mt-2 text-xs text-text-tertiary">Error: {error}</p>
        </div>

        <div className="rounded-lg border border-border bg-bg-secondary p-4 text-left text-xs text-text-secondary">
          <p className="font-medium text-text mb-2">Setup necesario:</p>
          <ol className="list-decimal ml-4 flex flex-col gap-1.5">
            <li>
              Ejecuta <code className="text-text">./scripts/setup.sh</code> en el
              proyecto
            </li>
            <li>
              O configura manualmente en{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials?project=sensa-os-ac840"
                target="_blank"
                className="underline text-text"
              >
                Google Cloud Console
              </a>
            </li>
            <li>
              Añade redirect URI:{" "}
              <code className="text-text break-all">
                https://quickal.vercel.app/api/auth/callback/google
              </code>
            </li>
          </ol>
        </div>

        <a
          href="/"
          className="text-xs text-text-tertiary underline hover:text-text"
        >
          Volver
        </a>
      </div>
    </div>
  );
}
