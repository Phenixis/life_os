"use client"

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DateTimePicker } from "./date-time-picker";
import { useCreateRelapse } from "@/hooks/use-addiction-tracker";

interface RelapseRecorderProps {
    addictionId: number;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export function RelapseRecorder({ addictionId, onSuccess, onCancel }: RelapseRecorderProps) {
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
    const [comment, setComment] = useState("");

    const createRelapse = useCreateRelapse();

    const handleSubmit = () => {
        createRelapse.mutate(
            { addictionId, comment: comment || undefined },
            {
                onSuccess: () => {
                    // Reset form
                    setDate(new Date());
                    setTime(new Date().toTimeString().slice(0, 5));
                    setComment("");
                    onSuccess?.();
                },
            }
        );
    };

    const handleCancel = () => {
        setDate(new Date());
        setTime(new Date().toTimeString().slice(0, 5));
        setComment("");
        onCancel?.();
    };

    return (
        <div className="mt-4 space-y-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
            <DateTimePicker
                date={date}
                time={time}
                onDateChange={setDate}
                onTimeChange={setTime}
                dateLabel="Relapse Date"
            />
            <div className="space-y-1">
                <label className="text-sm font-medium">Comment (optional)</label>
                <Textarea
                    placeholder="What triggered this? How are you feeling?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    className="resize-none"
                />
            </div>
            <div className="flex gap-2">
                <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={createRelapse.isPending}
                >
                    {createRelapse.isPending ? "Recording..." : "Record"}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                    disabled={createRelapse.isPending}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
