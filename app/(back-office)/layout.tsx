import Header from "@/components/big/header"
import { UserProvider } from "@/hooks/use-user"
import { getUser } from "@/lib/db/queries/user/user"
import { getDarkModeCookie } from "@/lib/cookies"
import { ModalCommandsProvider } from "@/contexts/modal-commands-context"
import ModalManager from "@/components/big/modal-manager"

export default async function BackOfficeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userPromise = getUser()
  const darkModeCookie = await getDarkModeCookie()

  return (
    <UserProvider userPromise={userPromise}>
      <ModalCommandsProvider>
        <main className="relative w-full h-full"  >
          <Header darkModeCookie={darkModeCookie} />
          <div className="w-full h-full">{children}</div>
        </main>
        <ModalManager />
      </ModalCommandsProvider>
    </UserProvider>
  )
}
