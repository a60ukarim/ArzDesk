import { AccountBack } from "@/components/account-back";
import { requireUser } from "@/lib/session";
import { getEmailDeliveryMode } from "@/lib/mail";
import { Brand } from "@/components/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { AccountMenu } from "@/components/account-menu";
import { AccountForm } from "@/features/auth/account-form";
import { DeveloperCredits } from "@/components/developer-credits";
export const metadata = { title: "Account settings" };
export default async function Page() {
  const user = await requireUser();
  return (
    <div className="account-page">
      <header className="account-header">
        <Brand />
        <div>
          <AccountBack />
          <ThemeSwitcher />
          <AccountMenu person={{ name: user.name, email: user.email }} />
        </div>
      </header>
      <main id="main-content" className="account-content">
        <div className="account-title">
          <span className="eyebrow">YOUR ACCOUNT</span>
          <h1>Account settings</h1>
          <p>Manage your name, sign-in email and password.</p>
        </div>
        <AccountForm
          user={{ name: user.name, email: user.email }}
          delivery={getEmailDeliveryMode()}
        />
        <footer className="footer">
          <DeveloperCredits />
        </footer>
      </main>
    </div>
  );
}
