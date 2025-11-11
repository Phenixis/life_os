import {WorkoutModal} from "@/components/big/workout/workout-modal"
import {SavedWorkouts} from "@/components/big/workout/saved-workout/saved-workout";
import {PastWorkouts} from "@/components/big/workout/past-workout/past-workouts";
import {WorkoutStats} from "@/components/big/workout/stats/workout-stats";

export default async function WorkoutPage() {
    return (
        <section className="w-full page grid grid-cols-1 xl:grid-cols-3 gap-4 *:size-full">
            <article className="order-2 lg:order-1">
                <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100 page-title`}>
                    Historique
                </h2>
                <PastWorkouts/>
            </article>
            <article className="order-1 lg:order-2">
                <header className="flex justify-between items-center space-x-4">
                    <h2 className="text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100 page-title">
                        New workout
                    </h2>
                    <WorkoutModal/>
                </header>
                <SavedWorkouts/>
            </article>
            <article className="order-3 lg:order-3">
                <h2 className={`text-lg lg:text-xl leading-loose text-gray-900 dark:text-gray-100 page-title`}>
                    Statistiques
                </h2>
                <WorkoutStats/>
            </article>
        </section>
    )
}