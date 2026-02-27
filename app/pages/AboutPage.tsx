import logoSvg from "../assets/logo.svg";

export default function AboutPage() {
  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex flex-col items-center text-center mb-10">
        <img src={logoSvg} alt="Cardpress logo" width={64} height={64} />
        <h1 className="mt-4 text-2xl font-bold text-text tracking-tight">
          Cardpress
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Design and print beautiful album cards from your music collection.
        </p>
      </div>

      <div className="space-y-8 text-sm text-text leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-text mb-2">
            What is this?
          </h2>
          <p>
            Cardpress generates printable 63&times;88&nbsp;mm double-sided music
            album cards. The front shows the cover art, title, and artist; the
            back lists every track with durations and an optional QR code. Search
            any album, customize the design in the Style Studio, then export as
            PNG, PDF, or duplex-ready print sheets.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text mb-2">
            Who made this?
          </h2>
          <p>
            Built by{" "}
            <a
              href="https://github.com/miguel-bm"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Miguel Blanco
            </a>{" "}
            as a personal project. I wanted a simple way to create nice-looking
            cards for my album collection — so I made one.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-text mb-2">
            Open source
          </h2>
          <p>
            Cardpress is open source under the MIT license. The code is on{" "}
            <a
              href="https://github.com/miguel-bm/cardpress"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            . Contributions, issues, and forks are welcome.
          </p>
        </section>
      </div>
    </div>
  );
}
