const companies = [
  "Meridian Health",
  "NovaPay",
  "CloudSync",
  "Catalyst Retail",
  "Vertex Labs",
  "Pulse Digital",
]

export function LandingSocialProof() {
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="mb-6 text-center text-sm font-medium text-muted-foreground">
          Trusted by CX teams at leading organizations
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {companies.map((name) => (
            <span
              key={name}
              className="text-base font-semibold tracking-tight text-muted-foreground/50"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
