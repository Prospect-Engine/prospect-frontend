import { GetServerSideProps } from "next";
import AuthGuard from "@/components/auth/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import CreateTemplate from "@/view/outreach/template/create-template";

export default function CreateTemplatePage() {
  return (
    <AuthGuard>
      <AppLayout activePage="Templates">
        <CreateTemplate />
      </AppLayout>
    </AuthGuard>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
