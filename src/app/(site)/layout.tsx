import { EmailVerifyBanner } from "@/components/auth/EmailVerifyBanner";
import { CallManager } from "@/components/calls/CallManager";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

/** Every public page gets the header and footer, plus the call panel (so calls ring and continue on any page). */
export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <EmailVerifyBanner />
      <main>{children}</main>
      <Footer />
      <CallManager />
    </>
  );
}
