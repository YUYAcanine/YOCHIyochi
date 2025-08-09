import Link from "next/link";

export default function Page3() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-purple-50">
      <Link
        href="/"
        className="rounded-lg bg-purple-600 px-6 py-3 text-white font-semibold shadow hover:bg-purple-500 transition"
      >
        Back to Home
      </Link>
    </main>
  );
}
