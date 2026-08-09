export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-gradient-to-br from-emerald-50 via-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">EMPRENDE AI</h1>
          <p className="mt-1 text-sm text-slate-500">El copiloto financiero y estratégico de tu negocio.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
