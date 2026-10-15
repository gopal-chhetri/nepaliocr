const items = [
  {
    title: 'Deleted within 24 hours',
    description: 'Uploaded images and extracted text are permanently deleted within a day.',
  },
  {
    title: 'Not used for training',
    description: 'Your documents are never used to train or fine-tune AI models.',
  },
  {
    title: 'No human reads them',
    description: 'Processing is automated. Nobody on our side opens or reviews your pages.',
  },
  {
    title: 'Encrypted in transit',
    description: 'Uploads travel over TLS 1.3.',
  },
]

export function Privacy({ page = false }: { page?: boolean }) {
  return (
    <section id="privacy" className={`${page ? 'py-12' : 'py-24'} bg-background`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-serif-display font-bold text-foreground">
            What happens to your pages
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Short version: we keep them for as long as it takes to read them, then delete them.
          </p>
        </div>

        <dl className="lg:col-span-3 divide-y divide-border border-y border-border">
          {items.map((item) => (
            <div key={item.title} className="grid sm:grid-cols-[14rem_1fr] gap-2 sm:gap-8 py-6">
              <dt className="font-semibold text-foreground">{item.title}</dt>
              <dd className="text-muted-foreground leading-relaxed">{item.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
