import Link from "next/link";

export default function Page2() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50">
      <Link
        href="/page3"
        className="rounded-lg bg-green-600 px-6 py-3 text-white font-semibold shadow hover:bg-green-500 transition"
      >
        Go to Page 3
      </Link>
    </main>
  );
}
