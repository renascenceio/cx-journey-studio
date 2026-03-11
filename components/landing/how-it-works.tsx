import { ArrowRight } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "Map",
    description:
      "Create your journey on the drag-and-drop canvas. Add numbered stages and steps, assign touch points with channels and sentiments, and define customer archetypes with pillar ratings and radar profiles.",
  },
  {
    number: "02",
    title: "Measure",
    description:
      "Visualize emotional arcs, track Journey Index, NPS, CSAT, and CES in real time. Switch between Columns, Swimlane, and Timeline views to analyze the experience from every angle.",
  },
  {
    number: "03",
    title: "Improve",
    description:
      "Run gap analysis between current and future states. Use AI to generate new stages, identify pain points, and design improvements backed by data. Deploy and monitor live.",
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Map. Measure. Improve.
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            A structured approach to understanding and improving every customer
            interaction, from first awareness to long-term retention.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.number} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.number}
                </span>
                {index < steps.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-muted-foreground md:block" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
