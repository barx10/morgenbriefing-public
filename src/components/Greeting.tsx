"use client";

interface GreetingProps {
  name?: string;
  offset: number;
}

export default function Greeting({ name, offset }: GreetingProps) {
  const suffix = name ? `, ${name}` : "";

  if (offset !== 0) {
    if (offset === 1) return <>I morgen{suffix}.</>;
    if (offset === -1) return <>I går{suffix}.</>;
    if (offset > 0) return <>Om {offset} dager{suffix}.</>;
    return <>For {Math.abs(offset)} dager siden{suffix}.</>;
  }

  const hour = new Date().getHours();
  const salutation =
    hour < 12 ? "God morgen" : hour < 18 ? "God ettermiddag" : "God kveld";

  return <>{salutation}{suffix}.</>;
}
