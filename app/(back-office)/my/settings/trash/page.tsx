import { TrashContent } from "@/components/big/settings/trash-content"

export default function TrashSettingsPage() {
    return (
        <section className="page">
            <h1 className="page-title">Trash</h1>
            <p className="page-description">
                Recover deleted tasks and notes. Items in the trash can be restored to their original location.
            </p>
            <div className="mt-8">
                <TrashContent />
            </div>
        </section>
    )
}
