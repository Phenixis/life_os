import {SidebarProvider} from "@/components/ui/sidebar"
import {ToolsSidebar} from '@/components/big/tools-sidebar'
import {MobileSidebarToggle} from "@/components/ui/mobile-sidebar-toggle"
import {UserQueries} from "@/lib/db/queries"
import {redirect} from "next/navigation";
import {SubscriptionLevels, SubscriptionWall} from "@/components/big/auth/subcription-wall";
import {getStripeProduct} from "@/lib/services/payments/stripe";

function ToolsLayoutContent({children}: { children: React.ReactNode }) {
    return (
        <>
            <ToolsSidebar/>
            <main className="w-full">
                {children}
            </main>
            <MobileSidebarToggle/>
        </>
    )
}

export default async function ToolsLayout({children}: { children: React.ReactNode }) {
    const user = await UserQueries.User.getUser()

    if (!user) {
        redirect("/login")
    }

    const activeSubscription = await UserQueries.Subscription.HasAnActive(user.id) ? await UserQueries.Subscription.GetActive(user.id) : null

    const subscriptionName = activeSubscription ? (await getStripeProduct(activeSubscription.stripe_product_id)).name : "Free"


    return (
        <SidebarProvider defaultOpen={false}>
            <ToolsLayoutContent>
                <SubscriptionWall minRequiredSubscription={"Basic"} userSubscription={subscriptionName as keyof typeof SubscriptionLevels} />
                {children}
            </ToolsLayoutContent>
        </SidebarProvider>
    )
}