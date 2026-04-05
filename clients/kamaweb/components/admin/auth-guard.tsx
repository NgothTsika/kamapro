"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getAdminToken } from "@/lib/admin-auth";
import { getMe } from "@/lib/kama-api";
import type { MeUser } from "@/lib/kama-types";
import type { ReactNode } from "react";

type AuthGuardProps = {
  children: (args: { token: string; user: MeUser }) => ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedToken = getAdminToken();
      if (!storedToken) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const me = await getMe(storedToken);
        if (!["ADMIN", "MODERATOR"].includes(me.role)) {
          router.replace("/login?reason=forbidden");
          return;
        }

        setToken(storedToken);
        setUser(me);
      } catch {
        router.replace("/login?reason=expired");
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, [pathname, router]);

  if (loading || !token || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Loading admin session...</span>
        </div>
      </div>
    );
  }

  return children({ token, user });
}
