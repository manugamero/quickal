import { auth, signIn, signOut } from "@/auth";
import { CalendarEvents } from "@/components/calendar-events";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600" />
            <span className="text-lg font-semibold tracking-tight">
              Sensa Workspace
            </span>
          </div>
          {session?.user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full"
                  />
                )}
                <span className="text-sm text-zinc-400">
                  {session.user.email}
                </span>
              </div>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {!session ? (
          <div className="flex flex-col items-center justify-center gap-8 pt-24">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight">
                Bienvenido a Sensa
              </h1>
              <p className="mt-3 text-lg text-zinc-400">
                Conecta tu cuenta de Google para ver tus eventos del calendario
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await signIn("google");
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-3 rounded-xl bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow-lg transition hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Conectar con Google
              </button>
            </form>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Tus próximos eventos
            </h1>
            <p className="mt-1 text-zinc-400">
              Eventos del calendario de {session.user?.email}
            </p>
            <div className="mt-8">
              <CalendarEvents />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
