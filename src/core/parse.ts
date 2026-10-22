// Saved data comes from older versions, other tabs or manual edits, so it is read without trusting its type: every
// field that is missing or invalid falls back on its own

export function isRecord(value: unknown): value is object {
    return typeof value === "object" && value !== null;
}

// One field of parsed JSON, undefined unless `record` is an object that has it
export function field(record: unknown, key: string): unknown {
    return isRecord(record) ? Object.getOwnPropertyDescriptor(record, key)?.value : undefined;
}
