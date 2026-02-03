"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { DateTimePicker } from "./date-time-picker";
import { useCreateAddiction } from "@/hooks/use-addiction-tracker";

interface AddictionCreatorProps {
    onSuccess?: (addictionId: number) => void;
    onCancel?: () => void;
}

export function AddictionCreator({ onSuccess, onCancel }: AddictionCreatorProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState(new Date());
    const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

    const createAddiction = useCreateAddiction();

    const handleSubmit = () => {
        if (!name.trim()) return;

        createAddiction.mutate(
            { title: name, description: description.trim() || undefined },
            {
                onSuccess: (addiction) => {
                    // Reset form
                    setName("");
                    setDescription("");
                    setDate(new Date());
                    setTime(new Date().toTimeString().slice(0, 5));
                    onSuccess?.(addiction.id);
                },
            }
        );
    };

    const handleCancel = () => {
        setName("");
        setDescription("");
        setDate(new Date());
        setTime(new Date().toTimeString().slice(0, 5));
        onCancel?.();
    };

    return (
        <div className="px-4 py-3 border-b border-dashed border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
                <Input
                    placeholder="Addiction name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <Textarea
                    placeholder="Description (optional) - What is your goal? Why are you tracking this?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                />
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                    <DateTimePicker
                        date={date}
                        time={time}
                        onDateChange={setDate}
                        onTimeChange={setTime}
                        dateLabel="First relapse date"
                    />
                    <div className="flex gap-2 lg:ml-auto">
                        <Button
                            size="sm"
                            className="flex-1"
                            onClick={handleSubmit}
                            disabled={createAddiction.isPending || !name.trim()}
                        >
                            {createAddiction.isPending ? "Creating..." : "Create"}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={handleCancel}
                            disabled={createAddiction.isPending}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
