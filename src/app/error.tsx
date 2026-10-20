"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-page">
      <h1>We hit a snag</h1>
      <p>
        Please try again. If the problem continues, ask your administrator to
        check the application and database connection.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
