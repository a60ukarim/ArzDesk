import {
  getEmailDeliveryMode,
  sendVerificationEmail,
  sendEmailChangeConfirmation,
} from "./mail";
export function accountOptions() {
  const available = getEmailDeliveryMode() !== "unavailable";
  return {
    user: {
      changeEmail: {
        enabled: true,
        updateEmailWithoutVerification: false,
        sendChangeEmailConfirmation: available
          ? async ({ user, url }: { user: { email: string }; url: string }) => {
              await sendEmailChangeConfirmation({ to: user.email, url });
            }
          : undefined,
      },
    },
    emailVerification: {
      expiresIn: 900,
      sendOnSignUp: false,
      sendOnSignIn: false,
      sendVerificationEmail: available
        ? async ({ user, url }: { user: { email: string }; url: string }) => {
            await sendVerificationEmail({ to: user.email, url });
          }
        : undefined,
    },
  };
}
