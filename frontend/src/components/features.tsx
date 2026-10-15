const steps = [
  {
    title: 'Upload a photo or scan',
    description:
      'JPG or PNG from a scanner or a phone camera. Flat, well-lit pages read best; a slight tilt is fine.',
  },
  {
    title: 'The model reads the Devanagari',
    description:
      "Google's Gemini model transcribes the page, including matras and conjuncts like क्ष, त्र and ज्ञ that older OCR engines break apart.",
  },
  {
    title: 'Fix, copy, keep',
    description:
      'Correct anything it missed in the editor, then copy the Unicode text into Word, Google Docs or a spreadsheet.',
  },
]

export function Features() {
  return (
    <section className="py-24 bg-background" id="features">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-foreground">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Most pages take a few seconds. You see the text next to your image, so you can check it
            line by line.
          </p>
        </div>

        <ol className="lg:col-span-3 divide-y divide-border border-y border-border">
          {steps.map((step, index) => (
            <li key={step.title} className="grid grid-cols-[3rem_1fr] gap-4 py-8">
              <span className="font-serif-display text-2xl font-bold text-accent">{index + 1}</span>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
