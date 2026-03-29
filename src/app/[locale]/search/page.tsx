
type SearchPageProps = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
};
export default async function SearchPage(props: SearchPageProps) {
  return <div>123123123</div>;
}
