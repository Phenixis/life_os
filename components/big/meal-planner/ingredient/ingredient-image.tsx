import * as Schema from "@/lib/db/schema"
import { cn } from "@/lib/utils";
import Image from "next/image"

enum Size {
    xs = "size-10",
    sm = "size-16",
    md = "size-20",
    lg = "size-24",
    xl = "size-32",
    "2xl" = "size-40",
    full = "w-full h-full",
}

export default function IngredientImage({
    ingredient,
    size = "xs",
}: Readonly<{
    ingredient: Schema.MealPlanner.Ingredient.Select;
    size?: keyof typeof Size;
}>) {
    return (!ingredient.image_url) ? (
        <div className={cn("inline-block mr-2 rounded-md bg-gray-400", Size[size])} />
    ) : (
        <Image
            src={ingredient.image_url}
            alt={ingredient.name}
            width={40}
            height={40}
            className={cn("inline-block mr-2 rounded-md object-cover", Size[size])}
        />
    )
}