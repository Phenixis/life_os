import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function Layout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <>
        <div className="absolute top-2 left-2">
            <Link href="/" className="text-black  hover:underline">
                <ArrowLeft className="inline mr-1" />
            </Link>
        </div>
        {children}
        </>
    )
}