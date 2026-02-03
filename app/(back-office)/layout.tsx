import Header from "@/components/big/header"
import MobileBottomNav from "@/components/big/mobile-bottom-nav"
import { UserProvider } from "@/hooks/use-user"
import { getUser } from "@/lib/db/queries/user/user"
import { getDarkModeCookie } from "@/lib/cookies"
import { ModalCommandsProvider } from "@/contexts/modal-commands-context"
import ModalManager from "@/components/big/modal-manager"
import { QueryProvider } from "@/lib/query-client-provider"

export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userPromise = getUser()
  const darkModeCookie = await getDarkModeCookie()

  return (
    <QueryProvider>
      <UserProvider userPromise={userPromise}>
        <ModalCommandsProvider>
          <main className="relative w-full h-full"  >
            <div className="hidden lg:block">
              <Header darkModeCookie={darkModeCookie} />
            </div>
            <div className="w-full h-full pb-16 lg:pb-0">{children}</div>
            <MobileBottomNav darkModeCookie={darkModeCookie} />
          </main>
          <ModalManager />
        </ModalCommandsProvider>
      </UserProvider>
    </QueryProvider>
  )
}
