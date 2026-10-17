export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`header,footer{display:none!important}`}</style>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </>
  );
}
