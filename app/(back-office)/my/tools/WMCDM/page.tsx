"use client";

import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Copy, Edit, FolderOpen, Info, Plus, Save, Trash, Trophy} from "lucide-react";
import {cn} from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {Tooltip, TooltipContent, TooltipTrigger,} from "@/components/ui/tooltip";
import {toast} from "sonner";
import {
    type DecisionMatrix,
    duplicateMatrix,
    getMatrix,
    getUserMatrices,
    removeMatrix,
    saveMatrix
} from "@/lib/auth/wmcdm-actions";

// Types definition for our WMCDM components
type Option = {
    id: string;
    name: string;
    scores: Record<string, number>;
};

type Criterion = {
    id: string;
    name: string;
    weight: number;
    description: string;
};

// Memoized ScoreSelect component to prevent unnecessary re-renders
const ScoreSelect = React.memo(({
                                    score,
                                    onScoreChange
                                }: {
    score: number;
    onScoreChange: (value: number) => void;
}) => (
    <Select
        value={score.toString()}
        onValueChange={(value) => onScoreChange(parseInt(value))}
    >
        <SelectTrigger className="h-8 w-14">
            <SelectValue placeholder="0"/>
        </SelectTrigger>
        <SelectContent>
            {[...Array(11)].map((_, i) => (
                <SelectItem key={i} value={i.toString()}>
                    {i}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
));

ScoreSelect.displayName = "ScoreSelect"; // Set display name for better debugging

export default function Page() {
    // Refs for focusing inputs and preventing double submissions
    const criterionNameRef = useRef<HTMLInputElement>(null);
    const optionNameRef = useRef<HTMLInputElement>(null);
    const isSubmittingCriterion = useRef(false);
    const isSubmittingOption = useRef(false);

    // State for the decision matrix - simplified to just criteria and options
    const [matrix, setMatrix] = useState<DecisionMatrix>({
        name: "",
        criteria: [],
        options: []
    });

    // State for saved matrices
    const [savedMatrices, setSavedMatrices] = useState<Array<{
        id: number;
        name: string;
        description?: string;
        created_at: Date;
        updated_at: Date
    }>>([]);
    const [currentMatrixId, setCurrentMatrixId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // State for matrix management
    const [showMatrixDialog, setShowMatrixDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [matrixName, setMatrixName] = useState("");
    const [matrixDescription, setMatrixDescription] = useState("");

    // State for new criterion or option
    const [newCriterionName, setNewCriterionName] = useState("");
    const [newCriterionWeight, setNewCriterionWeight] = useState(1);
    const [newCriterionDescription, setNewCriterionDescription] = useState("");
    const [newOptionName, setNewOptionName] = useState("");

    // State for editing criterion
    const [editingCriterion, setEditingCriterion] = useState<Criterion | null>(null);
    const [showCriterionDialog, setShowCriterionDialog] = useState(false);

    // State for save status notifications
    const [localSaveStatus, setLocalSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [onlineSaveStatus, setOnlineSaveStatus] = useState<'saved' | 'saving' | 'not-saved'>('not-saved');

    // Utility function to load matrix from local storage
    const loadFromLocalStorage = useCallback((): DecisionMatrix | null => {
        try {
            const stored = localStorage.getItem("wmcdm-matrix");
            if (stored) {
                const parsed = JSON.parse(stored);
                // Basic validation to ensure structure
                if (parsed && typeof parsed === "object" && Array.isArray(parsed.criteria) && Array.isArray(parsed.options)) {
                    return parsed as DecisionMatrix;
                }
            }
        } catch (error) {
            console.error("Failed to load matrix from local storage:", error);
        }
        return null;
    }, []);

    // Load from local storage on component mount (only once)
    useEffect(() => {
        const localMatrix = loadFromLocalStorage();
        if (localMatrix) {
            setMatrix(localMatrix);
            setLocalSaveStatus('saved');
        }
    }, [loadFromLocalStorage]);

    // Load user matrices from database
    const loadUserMatrices = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getUserMatrices();
            if (result.success && result.matrices) {
                setSavedMatrices(result.matrices);
            } else {
                toast.error(result.error || "Failed to load matrices");
            }
        } catch (error) {
            console.error("Error loading matrices:", error);
            toast.error("Failed to load matrices");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Function to add a new criterion
    const addCriterion = useCallback(() => {
        if (isSubmittingCriterion.current) return;

        if (!newCriterionName.trim()) {
            toast.error("Criterion name cannot be empty");
            return;
        }

        isSubmittingCriterion.current = true;

        const newCriterion: Criterion = {
            id: `criterion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newCriterionName.trim(),
            weight: newCriterionWeight,
            description: newCriterionDescription.trim()
        };

        setMatrix(prev => {
            // Add the criterion
            const updatedMatrix = {
                ...prev,
                criteria: [...prev.criteria, newCriterion]
            };

            // Add this criterion to each existing option with a default score of 0
            updatedMatrix.options = updatedMatrix.options.map(option => ({
                ...option,
                scores: {
                    ...option.scores,
                    [newCriterion.id]: 0
                }
            }));

            return updatedMatrix;
        });

        // Reset the form fields
        setNewCriterionName("");
        setNewCriterionWeight(1);
        setNewCriterionDescription("");

        // Focus back on the criterion name input
        setTimeout(() => {
            criterionNameRef.current?.focus();
            isSubmittingCriterion.current = false;
        }, 100);

        toast.success("Criterion added successfully");
    }, [newCriterionName, newCriterionWeight, newCriterionDescription]);

    // Function to update a criterion
    const updateCriterion = useCallback(() => {
        if (!editingCriterion || !editingCriterion.name.trim()) {
            toast.error("Criterion name cannot be empty");
            return;
        }

        setMatrix(prev => {
            const updatedCriteria = prev.criteria.map(criterion =>
                criterion.id === editingCriterion.id ? {
                    ...editingCriterion,
                    name: editingCriterion.name.trim(),
                    description: editingCriterion.description.trim()
                } : criterion
            );

            return {
                ...prev,
                criteria: updatedCriteria
            };
        });

        setEditingCriterion(null);
        setShowCriterionDialog(false);
        toast.success("Criterion updated successfully");
    }, [editingCriterion]);

    // Function to add a new option
    const addOption = useCallback(() => {
        if (isSubmittingOption.current) return;

        if (!newOptionName.trim()) {
            toast.error("Option name cannot be empty");
            return;
        }

        isSubmittingOption.current = true;

        const newOption: Option = {
            id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newOptionName.trim(),
            scores: {}
        };

        // Initialize scores for each criterion
        matrix.criteria.forEach(criterion => {
            newOption.scores[criterion.id] = 0;
        });

        setMatrix(prev => ({
            ...prev,
            options: [...prev.options, newOption]
        }));

        // Reset the form field
        setNewOptionName("");

        // Focus back on the option name input
        setTimeout(() => {
            optionNameRef.current?.focus();
            isSubmittingOption.current = false;
        }, 100);

        toast.success("Option added successfully");
    }, [newOptionName, matrix.criteria]);

    // Handle keyboard shortcuts for criterion dialog
    const handleCriterionKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            addCriterion();
            criterionNameRef.current?.focus();
        }
    }, [addCriterion]);

    // Handle keyboard shortcuts for option dialog
    const handleOptionKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            addOption();
        }
    }, [addOption]);

    // Function to update a score - optimized with useCallback
    const updateScore = useCallback((optionId: string, criterionId: string, score: number) => {
        // Make sure the score is between 0 and 10
        const validScore = Math.min(Math.max(score, 0), 10);

        setMatrix(prev => {
            const updatedOptions = prev.options.map(option => {
                if (option.id === optionId) {
                    return {
                        ...option,
                        scores: {
                            ...option.scores,
                            [criterionId]: validScore
                        }
                    };
                }
                return option;
            });

            return {
                ...prev,
                options: updatedOptions
            };
        });
    }, []);

    // Function to remove a criterion
    const removeCriterion = (criterionId: string) => {
        setMatrix(prev => {
            // Remove the criterion
            const updatedCriteria = prev.criteria.filter(c => c.id !== criterionId);

            // Remove this criterion's scores from all options
            const updatedOptions = prev.options.map(option => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[criterionId]: _, ...remainingScores} = option.scores;
                return {
                    ...option,
                    scores: remainingScores
                };
            });

            return {
                ...prev,
                criteria: updatedCriteria,
                options: updatedOptions
            };
        });

        toast.success("Criterion removed successfully");
    };

    // Function to remove an option
    const removeOption = (optionId: string) => {
        setMatrix(prev => ({
            ...prev,
            options: prev.options.filter(o => o.id !== optionId)
        }));

        toast.success("Option removed successfully");
    };

    /**
     * Calculate weighted scores for each option and criterion
     * @returns Record of weighted scores for each option and criterion
     */
    const calculateWeightedScores = useMemo(() => {
        // Calculate weighted score for each option and criterion
        const weightedScores: Record<string, Record<string, number>> = {};

        matrix.options.forEach(option => {
            weightedScores[option.id] = {};
            matrix.criteria.forEach(criterion => {
                const score = option.scores[criterion.id] || 0;
                const weightedScore = score * criterion.weight;
                weightedScores[option.id][criterion.id] = weightedScore;
            });
        });

        return weightedScores;
    }, [matrix.options, matrix.criteria]);

    /**
     * Calculate totals for each option
     * @returns Record containing total and normalized scores for each option
     */
    const calculateTotals = useMemo(() => {
        const totals: Record<string, { total: number, normalized: number }> = {};
        const totalWeight = matrix.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);

        matrix.options.forEach(option => {
            const total = Object.values(calculateWeightedScores[option.id] || {}).reduce((sum, score) => sum + score, 0);
            // Normalize to a score out of 10
            const normalized = totalWeight > 0 ? (total / totalWeight) * 10 : 0;

            totals[option.id] = {
                total,
                normalized: parseFloat(normalized.toFixed(1))
            };
        });

        return totals;
    }, [calculateWeightedScores, matrix.criteria, matrix.options]);

    /**
     * Find the winner option for a specific criterion
     * @param criterionId The ID of the criterion to evaluate
     * @returns The winning option or null if no options
     */
    const findWinnerForCriterion = useCallback((criterionId: string): Option | null => {
        if (matrix.options.length === 0) return null;

        return matrix.options.reduce((winner, current) => {
            const currentScore = current.scores[criterionId] || 0;
            const winnerScore = winner ? (winner.scores[criterionId] || 0) : -1;

            return currentScore > winnerScore ? current : winner;
        }, null as Option | null);
    }, [matrix.options]);

    // Save current matrix to database
    const saveCurrentMatrix = async () => {
        if (!matrixName.trim()) {
            toast.error("Please enter a name for the matrix");
            return;
        }

        if (matrix.criteria.length === 0 && matrix.options.length === 0) {
            toast.error("Cannot save an empty matrix. Please add criteria or options first.");
            return;
        }

        setIsLoading(true);
        setOnlineSaveStatus('saving');
        try {
            const matrixToSave: DecisionMatrix = {
                ...matrix,
                id: currentMatrixId || undefined,
                name: matrixName,
                description: matrixDescription
            };

            const result = await saveMatrix(matrixToSave);

            if (result.success) {
                setCurrentMatrixId(result.matrixId || null);
                setOnlineSaveStatus('saved');
                toast.success("Saved online");
                setShowMatrixDialog(false);
                setMatrixName("");
                setMatrixDescription("");
                await loadUserMatrices(); // Refresh the list
            } else {
                setOnlineSaveStatus('not-saved');
                toast.error(result.error || "Failed to save matrix");
            }
        } catch (error) {
            console.error("Error saving matrix:", error);
            setOnlineSaveStatus('not-saved');
            toast.error("Failed to save matrix");
        } finally {
            setIsLoading(false);
        }
    };

    // Load a matrix from database
    const loadMatrixFromDatabase = async (matrixId: number) => {
        setIsLoading(true);
        try {
            const result = await getMatrix(matrixId);

            if (result.success && result.matrix) {
                setMatrix(result.matrix);
                setCurrentMatrixId(matrixId);
                // Pre-populate the save dialog fields with loaded matrix data
                setMatrixName(result.matrix.name || "");
                setMatrixDescription(result.matrix.description || "");
                setOnlineSaveStatus('saved'); // Matrix loaded from online is considered saved
                setShowLoadDialog(false);
                toast.success("Matrix loaded successfully");
            } else {
                toast.error(result.error || "Failed to load matrix");
            }
        } catch (error) {
            console.error("Error loading matrix:", error);
            toast.error("Failed to load matrix");
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a matrix from database
    const deleteMatrixFromDatabase = async (matrixId: number) => {
        setIsLoading(true);
        try {
            const result = await removeMatrix(matrixId);

            if (result.success) {
                toast.success("Matrix deleted successfully");
                await loadUserMatrices(); // Refresh the list

                // If we deleted the currently loaded matrix, reset the current state
                if (currentMatrixId === matrixId) {
                    setMatrix({name: "", criteria: [], options: []});
                    setCurrentMatrixId(null);
                }
            } else {
                toast.error(result.error || "Failed to delete matrix");
            }
        } catch (error) {
            console.error("Error deleting matrix:", error);
            toast.error("Failed to delete matrix");
        } finally {
            setIsLoading(false);
        }
    };

    // Duplicate a matrix
    const duplicateMatrixFromDatabase = async (matrixId: number, originalName: string) => {
        const newName = prompt(`Enter a name for the duplicated matrix:`, `${originalName} (Copy)`);

        if (!newName || !newName.trim()) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await duplicateMatrix(matrixId, newName.trim());

            if (result.success) {
                toast.success("Matrix duplicated successfully");
                await loadUserMatrices(); // Refresh the list
            } else {
                toast.error(result.error || "Failed to duplicate matrix");
            }
        } catch (error) {
            console.error("Error duplicating matrix:", error);
            toast.error("Failed to duplicate matrix");
        } finally {
            setIsLoading(false);
        }
    };

    // Reset the entire matrix
    const resetMatrix = () => {
        setMatrix({
            name: "",
            criteria: [],
            options: []
        });
        setCurrentMatrixId(null);
        setMatrixName("");
        setMatrixDescription("");
        setLocalSaveStatus('saved'); // Empty matrix is considered saved
        setOnlineSaveStatus('not-saved'); // Reset to not saved online
        toast.success("Matrix reset successfully");
    };

    // Open save dialog with current matrix data pre-populated
    const openSaveDialog = () => {
        // If we have a current matrix loaded, pre-populate with its data
        if (currentMatrixId && matrix.name) {
            setMatrixName(matrix.name);
            setMatrixDescription(matrix.description || "");
        } else if (!matrixName && matrix.name) {
            // If no saved matrix but matrix has a name, use it
            setMatrixName(matrix.name);
            setMatrixDescription(matrix.description || "");
        }
        setShowMatrixDialog(true);
    };

    // Calculate weighted scores and totals - memoized for performance
    const weightedScores = calculateWeightedScores;
    const totals = calculateTotals;
    const totalWeight = useMemo(() => matrix.criteria.reduce((sum, criterion) => sum + criterion.weight, 0), [matrix.criteria]);

    // Find the best overall option (highest normalized score) - memoized
    const bestOption = useMemo(() => {
        if (matrix.options.length === 0) return null;

        return matrix.options.reduce((best, current) => {
            const currentScore = totals[current.id]?.normalized || 0;
            const bestScore = best ? totals[best.id]?.normalized || 0 : -1;
            return currentScore > bestScore ? current : best;
        }, null as Option | null);
    }, [matrix.options, totals]);

    // Sort criteria by their weight in descending order - memoized
    const sortedCriteria = useMemo(() => {
        return [...matrix.criteria].sort((a, b) => b.weight - a.weight);
    }, [matrix.criteria]);

    // Sort options by their name alphabetically for consistent ordering - memoized
    const sortedOptions = useMemo(() => {
        return [...matrix.options].sort((a, b) => a.name.localeCompare(b.name));
    }, [matrix.options]);

    return (
        <section className="page">
            <h1 className="page-title">Weighted Multi-Criteria Decision Matrix</h1>
            <p className="page-description">
                A decision-making tool that helps evaluate multiple options against various criteria,
                with each criterion having a different level of importance (weight).
            </p>

            {/* Save Status Indicators */}
            <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        localSaveStatus === 'saved' && "bg-green-500",
                        localSaveStatus === 'saving' && "bg-yellow-500 animate-pulse",
                        localSaveStatus === 'unsaved' && "bg-red-500"
                    )}/>
                    <span className="text-muted-foreground">
                            {localSaveStatus === 'saved' && "Saved locally"}
                        {localSaveStatus === 'saving' && "Saving locally..."}
                        {localSaveStatus === 'unsaved' && "Not saved locally"}
                        </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        onlineSaveStatus === 'saved' && "bg-green-500",
                        onlineSaveStatus === 'saving' && "bg-yellow-500 animate-pulse",
                        onlineSaveStatus === 'not-saved' && "bg-gray-400"
                    )}/>
                    <span className="text-muted-foreground">
                            {onlineSaveStatus === 'saved' && "Saved online"}
                        {onlineSaveStatus === 'saving' && "Saving online..."}
                        {onlineSaveStatus === 'not-saved' && "Not saved online"}
                        </span>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-between mb-8">
                <div className="flex flex-wrap gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4"/> Add Criterion
                            </Button>
                        </DialogTrigger>
                        <DialogContent maxHeight="max-h-110" onKeyDown={handleCriterionKeyDown}>
                            <div className="h-full flex flex-col gap-4 justify-between">
                                <main>
                                    <DialogHeader>
                                        <DialogTitle>Add New Criterion</DialogTitle>
                                        <DialogDescription>
                                            Define a criterion for evaluating your options. Press Ctrl+Enter to quickly
                                            add.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="criterion-name">Criterion Name</Label>
                                            <Input
                                                ref={criterionNameRef}
                                                id="criterion-name"
                                                value={newCriterionName}
                                                onChange={(e) => setNewCriterionName(e.target.value)}
                                                placeholder="e.g., Cost, Quality, etc."
                                                onKeyDown={handleCriterionKeyDown}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="criterion-weight">Weight (1-5)</Label>
                                            <Select
                                                value={newCriterionWeight.toString()}
                                                onValueChange={(value) => setNewCriterionWeight(parseInt(value))}
                                            >
                                                <SelectTrigger id="criterion-weight">
                                                    <SelectValue placeholder="Weight"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">1 - Least Important</SelectItem>
                                                    <SelectItem value="2">2 - Somewhat Important</SelectItem>
                                                    <SelectItem value="3">3 - Important</SelectItem>
                                                    <SelectItem value="4">4 - Very Important</SelectItem>
                                                    <SelectItem value="5">5 - Critical</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="criterion-description">Description (Optional)</Label>
                                            <Textarea
                                                id="criterion-description"
                                                value={newCriterionDescription}
                                                onChange={(e) => setNewCriterionDescription(e.target.value)}
                                                placeholder="Describe what this criterion means..."
                                                onKeyDown={handleCriterionKeyDown}
                                            />
                                        </div>
                                    </div>
                                </main>
                                <DialogFooter>
                                    <Button onClick={addCriterion}>Add Criterion</Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4"/> Add Option
                            </Button>
                        </DialogTrigger>
                        <DialogContent onKeyDown={handleOptionKeyDown} maxHeight="max-h-64">
                            <div className="h-full flex flex-col gap-4 justify-between">
                                <main>

                                    <DialogHeader>
                                        <DialogTitle>Add New Option</DialogTitle>
                                        <DialogDescription>
                                            Add an option to evaluate against your criteria. Press Ctrl+Enter to quickly
                                            add.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="option-name">Option Name</Label>
                                            <Input
                                                ref={optionNameRef}
                                                id="option-name"
                                                value={newOptionName}
                                                onChange={(e) => setNewOptionName(e.target.value)}
                                                placeholder="e.g., Option A, Plan 1, etc."
                                                onKeyDown={handleOptionKeyDown}
                                            />
                                        </div>
                                    </div>
                                </main>
                                <DialogFooter>
                                    <Button onClick={addOption}>Add Option</Button>
                                </DialogFooter>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Dialog open={showMatrixDialog} onOpenChange={setShowMatrixDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center" onClick={openSaveDialog}>
                                <Save className="mr-2 h-4 w-4"/> Save Matrix
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {currentMatrixId ? "Update Matrix" : "Save Matrix"}
                                </DialogTitle>
                                <DialogDescription>
                                    {currentMatrixId
                                        ? "Update your existing decision matrix in the database."
                                        : "Save your decision matrix to the database for later use."
                                    }
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="matrix-name">Matrix Name</Label>
                                    <Input
                                        id="matrix-name"
                                        value={matrixName}
                                        onChange={(e) => setMatrixName(e.target.value)}
                                        placeholder="Enter a name for your matrix"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="matrix-description">Description (Optional)</Label>
                                    <Textarea
                                        id="matrix-description"
                                        value={matrixDescription}
                                        onChange={(e) => setMatrixDescription(e.target.value)}
                                        placeholder="Describe what this matrix is for..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowMatrixDialog(false)}>Cancel</Button>
                                <Button onClick={saveCurrentMatrix} disabled={isLoading}>
                                    {isLoading
                                        ? (currentMatrixId ? "Updating..." : "Saving...")
                                        : (currentMatrixId ? "Update Matrix" : "Save Matrix")
                                    }
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex items-center">
                                <FolderOpen className="mr-2 h-4 w-4"/> Load Matrix
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Load Saved Matrix</DialogTitle>
                                <DialogDescription>
                                    Choose a matrix to load from your saved matrices.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                {isLoading ? (
                                    <div className="text-center py-8">Loading matrices...</div>
                                ) : savedMatrices.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No saved matrices found. Create and save a matrix first.
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {savedMatrices.map((savedMatrix) => (
                                            <div key={savedMatrix.id}
                                                 className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{savedMatrix.name}</h4>
                                                    {savedMatrix.description && (
                                                        <p className="text-sm text-muted-foreground">{savedMatrix.description}</p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Created: {new Date(savedMatrix.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => loadMatrixFromDatabase(savedMatrix.id)}
                                                        disabled={isLoading}
                                                    >
                                                        Load
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => duplicateMatrixFromDatabase(savedMatrix.id, savedMatrix.name)}
                                                        disabled={isLoading}
                                                    >
                                                        <Copy className="h-4 w-4"/>
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button size="sm" variant="destructive">
                                                                <Trash className="h-4 w-4"/>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Matrix</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to
                                                                    delete &quot;{savedMatrix.name}&quot;? This action
                                                                    cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => deleteMatrixFromDatabase(savedMatrix.id)}
                                                                    className="bg-destructive text-destructive-foreground"
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowLoadDialog(false)}>Close</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">Reset</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Reset Matrix</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to reset the decision matrix? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={resetMatrix}>Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Edit Criterion Dialog */}
            <Dialog open={showCriterionDialog} onOpenChange={setShowCriterionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Criterion</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {editingCriterion && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-criterion-name">Criterion Name</Label>
                                    <Input
                                        id="edit-criterion-name"
                                        value={editingCriterion.name}
                                        onChange={(e) => setEditingCriterion({
                                            ...editingCriterion,
                                            name: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-criterion-weight">Weight (1-5)</Label>
                                    <Select
                                        value={editingCriterion.weight.toString()}
                                        onValueChange={(value) => setEditingCriterion({
                                            ...editingCriterion,
                                            weight: parseInt(value)
                                        })}
                                    >
                                        <SelectTrigger id="edit-criterion-weight">
                                            <SelectValue placeholder="Weight"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1 - Least Important</SelectItem>
                                            <SelectItem value="2">2 - Somewhat Important</SelectItem>
                                            <SelectItem value="3">3 - Important</SelectItem>
                                            <SelectItem value="4">4 - Very Important</SelectItem>
                                            <SelectItem value="5">5 - Critical</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-criterion-description">Description</Label>
                                    <Textarea
                                        id="edit-criterion-description"
                                        value={editingCriterion.description}
                                        onChange={(e) => setEditingCriterion({
                                            ...editingCriterion,
                                            description: e.target.value
                                        })}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCriterionDialog(false)}>Cancel</Button>
                        <Button onClick={updateCriterion}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Decision Matrix Table */}
            {matrix.criteria.length > 0 || matrix.options.length > 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Decision Matrix</CardTitle>
                        <CardDescription>
                            Score each option against each criterion (0-10). Options are sorted from least to most
                            interesting based on weighted scores.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto" fullPadding>
                        <Table className="mx-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px] min-w-[180px]">Criteria</TableHead>
                                    <TableHead className="w-[80px] min-w-[80px] text-center">Weight</TableHead>
                                    {sortedOptions.map(option => (
                                        <TableHead
                                            key={option.id}
                                            className="text-center min-w-[120px] group/Option"
                                            style={{width: sortedOptions.length > 0 ? `${(100 - 25) / sortedOptions.length}%` : 'auto'}}
                                        >
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="truncate">{option.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeOption(option.id)}
                                                    className="h-7 w-7 p-0 lg:opacity-0 lg:group-hover/Option:opacity-100 transition-opacity duration-200 shrink-0"
                                                    aria-label={`Remove ${option.name}`}
                                                >
                                                    <Trash className="h-3.5 w-3.5 text-destructive"/>
                                                </Button>
                                            </div>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center min-w-[120px] w-[120px]">
                                        Winner
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedCriteria.map(criterion => {
                                    const winner = findWinnerForCriterion(criterion.id);
                                    return (
                                        <TableRow key={criterion.id}>
                                            <TableCell className="font-medium group/Criterion">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        {criterion.name}
                                                        {criterion.description && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Info
                                                                        className="inline ml-1 h-3.5 w-3.5 text-muted-foreground cursor-help"/>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="max-w-[300px] text-xs">
                                                                    {criterion.description}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="flex gap-1 lg:group-hover/Criterion:opacity-100 lg:opacity-0 transition-opacity duration-200">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingCriterion(criterion);
                                                                setShowCriterionDialog(true);
                                                            }}
                                                            className="h-7 w-7 p-0"
                                                            aria-label={`Edit ${criterion.name}`}
                                                        >
                                                            <Edit className="h-3.5 w-3.5 text-muted-foreground"/>
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeCriterion(criterion.id)}
                                                            className="h-7 w-7 p-0"
                                                            aria-label={`Remove ${criterion.name}`}
                                                        >
                                                            <Trash className="h-3.5 w-3.5 text-destructive"/>
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold">
                                                {criterion.weight}
                                            </TableCell>

                                            {sortedOptions.map(option => {
                                                const score = option.scores[criterion.id] || 0;
                                                const weightedScore = weightedScores[option.id]?.[criterion.id] || 0;
                                                const isWinner = winner && winner.id === option.id && score > 0;

                                                // Create callback for this specific score update
                                                const handleScoreChange = (value: number) => {
                                                    updateScore(option.id, criterion.id, value);
                                                };

                                                return (
                                                    <TableCell
                                                        key={`${criterion.id}-${option.id}`}
                                                        className={cn(
                                                            "text-center",
                                                            isWinner && "bg-green-50 dark:bg-green-900/20"
                                                        )}
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <ScoreSelect
                                                                score={score}
                                                                onScoreChange={handleScoreChange}
                                                            />
                                                            <span className="text-xs text-muted-foreground mt-1">
                                                                {weightedScore.toFixed(1)}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                );
                                            })}

                                            {/* Winner for this criterion */}
                                            <TableCell className="text-center">
                                                {winner && winner.scores[criterion.id] > 0 ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-semibold">{winner.name}</span>
                                                        <div
                                                            className="flex items-center text-xs text-amber-600 dark:text-amber-500">
                                                            <Trophy className="h-3 w-3 mr-1"/>
                                                            <span>{winner.scores[criterion.id]}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No winner</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}

                                {/* Total row */}
                                <TableRow className="border-t-2">
                                    <TableCell className="font-medium">Total</TableCell>
                                    <TableCell className="text-center">{totalWeight}</TableCell>

                                    {sortedOptions.map(option => (
                                        <TableCell key={`total-${option.id}`} className="text-center font-bold">
                                            {totals[option.id]?.total.toFixed(1)}
                                        </TableCell>
                                    ))}

                                    <TableCell className="text-center">
                                        {bestOption && (
                                            <div className="flex flex-col items-center">
                                                <span className="font-semibold">{bestOption.name}</span>
                                                <div className="text-xs text-muted-foreground">Best overall</div>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>

                                {/* Normalized score row */}
                                <TableRow>
                                    <TableCell className="font-medium">Score (0-100)</TableCell>
                                    <TableCell></TableCell>

                                    {sortedOptions.map((option) => (
                                        <TableCell
                                            key={`normalized-${option.id}`}
                                            className={cn(
                                                "text-center font-bold",
                                                bestOption && option.id === bestOption.id && "text-green-600 dark:text-green-500"
                                            )}
                                        >
                                            {totals[option.id]?.normalized.toFixed(1)}
                                        </TableCell>
                                    ))}

                                    <TableCell></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter>
                        <div className="text-sm text-muted-foreground">
                            <span className="font-medium">Legend: </span>
                            The top value in each cell is the raw score (0-10) and the bottom value is the weighted
                            score.
                            Criteria are sorted by weight importance (highest first) and options alphabetically.
                        </div>
                    </CardFooter>
                </Card>
            ) : (
                <Card className="w-full">
                    <CardContent fullPadding>
                        <div className="text-center space-y-4">
                            <h3 className="text-lg font-semibold">No criteria or options yet</h3>
                            <p className="text-muted-foreground">Add criteria and options to build your decision
                                matrix.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </section>
    );
}