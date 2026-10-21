import { Interstitial } from "@/components/interstitial";
import { Prototype } from "@/components/prototype";

// Rendered per request, with no Suspense boundary, so the server sends the
// exact step the URL asks for in the first paint: a deep link from an email
// lands on the right moment with no layout shift.
export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await searchParams;
  return (
    <>
      <Prototype />
      <Interstitial />
    </>
  );
}
