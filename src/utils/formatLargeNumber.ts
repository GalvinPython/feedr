export default function (input: string | null | undefined): string {
    if (!input) return "N/A";

    const match = input.match(/^([\d.]+)\s*(K|M|B)?/i);

    if (!match) return "N/A";

    const [, numericString, suffix] = match;
    const numericValue = parseFloat(numericString);

    const multipliers: Record<string, number> = {
        K: 1e3,
        M: 1e6,
        B: 1e9,
    };

    return (
        numericValue * (multipliers[suffix?.toUpperCase()] || 1)
    ).toLocaleString();
}
