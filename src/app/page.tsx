import HomePage from "./_components/home-page";

export const metadata = {
  title: "Acme Inc.",
  description: "View sleek, elegant fashion products",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const Page = () => {
  return <HomePage />;
};

export default Page;
