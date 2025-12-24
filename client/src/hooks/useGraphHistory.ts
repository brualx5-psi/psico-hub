import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export function useGraphHistory<T>(initialPresent: T) {
    const [state, setState] = useState<HistoryState<T>>({
        past: [],
        present: initialPresent,
        future: [],
    });

    const canUndo = state.past.length > 0;
    const canRedo = state.future.length > 0;

    const undo = useCallback(() => {
        setState((currentState) => {
            if (currentState.past.length === 0) return currentState;

            const previous = currentState.past[currentState.past.length - 1];
            const newPast = currentState.past.slice(0, currentState.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [currentState.present, ...currentState.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setState((currentState) => {
            if (currentState.future.length === 0) return currentState;

            const next = currentState.future[0];
            const newFuture = currentState.future.slice(1);

            return {
                past: [...currentState.past, currentState.present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const takeSnapshot = useCallback((newPresent: T) => {
        setState((currentState) => {
            // Don't save if state hasn't changed (deep comparison is expensive, so we rely on reference or simple check usually, 
            // but for this graph we assume the caller only calls this on actual change)
            if (JSON.stringify(currentState.present) === JSON.stringify(newPresent)) {
                return currentState;
            }

            return {
                past: [...currentState.past, currentState.present],
                present: newPresent,
                future: [], // Clear future on new action (standard undo behavior)
            };
        });
    }, []);

    /**
     * Sets the initial state without adding to history (e.g. on load)
     */
    const setInitialState = useCallback((item: T) => {
        setState({
            past: [],
            present: item,
            future: []
        })
    }, [])

    return {
        state: state.present,
        undo,
        redo,
        takeSnapshot,
        canUndo,
        canRedo,
        setInitialState
    };
}
