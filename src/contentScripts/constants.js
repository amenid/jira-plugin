// Global constants
export const validActivities = ["Nightly", "Coverage", "Periodic_2h", "Weekly", "FV", "PreInt", "PreGate"];

// Global error state
export const errorFlags = {
    priority: false,
    components: false,
    version: false
};

export const errorState = {
    categorization: false,
    variant2: false,
    errorOccurrence: false,
    otherText: false
};

// Active alerts tracking
export const activeAlerts = new Set();