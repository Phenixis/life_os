import { DatePicker } from "@/components/big/date-picker";
import { Input } from "@/components/ui/input";

interface DateTimePickerProps {
    date: Date;
    time: string;
    onDateChange: (date: Date) => void;
    onTimeChange: (time: string) => void;
    dateLabel?: string;
    timeLabel?: string;
}

export function DateTimePicker({
    date,
    time,
    onDateChange,
    onTimeChange,
    dateLabel = "Date",
    timeLabel = "Time",
}: DateTimePickerProps) {
    return (
        <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">{dateLabel}</label>
                <DatePicker value={date} onChange={onDateChange} />
            </div>
            <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500 dark:text-gray-400">{timeLabel}</label>
                <Input
                    type="time"
                    value={time}
                    onChange={(e) => onTimeChange(e.target.value)}
                    className="w-32"
                />
            </div>
        </div>
    );
}
