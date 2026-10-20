import { getEmailDeliveryMode, sendPasswordResetEmail } from "./mail";
export function passwordRecoveryOptions() {
  return {
    resetPasswordTokenExpiresIn: 15 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword:
      getEmailDeliveryMode() === "unavailable"
        ? undefined
        : async ({ user, url }: { user: { email: string }; url: string }) => {
            await sendPasswordResetEmail({ to: user.email, url });
          },
  };
}
