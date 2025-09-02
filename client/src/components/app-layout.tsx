import { ReactNode } from "react";
import { Helmet } from "react-helmet";

type AppLayoutProps = {
  title: string;
  children: ReactNode;
};

const AppLayout = ({ title, children }: AppLayoutProps) => {
  return (
    <div className="container mx-auto py-6 px-4">
      <Helmet>
        <title>{title} | ONU Parts Tracker</title>
      </Helmet>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {children}
    </div>
  );
};

export default AppLayout;