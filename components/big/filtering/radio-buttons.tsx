import {Button} from "@/components/ui/button";

export function RadioButtons(
    {
        values,
        currentValue,
        onChange,
        disabled,
    }: {
        values: any[],
        currentValue: any,
        onChange: (value: any) => void,
        disabled?: boolean
    }
) {
    return (
        <div className="flex flex-row items-center gap-1">
            {
                values.map((value, index) => (
                    <Button
                        key={index}
                        variant={currentValue == value ? "default" : "outline"}
                        size="sm"
                        onClick={() => onChange(value)}
                        disabled={disabled}
                        tooltip={value}
                    >
                        {value}
                    </Button>
                ))
            }
        </div>
    )
}