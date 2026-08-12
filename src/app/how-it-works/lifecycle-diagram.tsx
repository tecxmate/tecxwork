/**
 * The placement lifecycle, drawn rather than listed.
 *
 * Hand-authored inline SVG, no charting library. Inline SVG resolves CSS custom
 * properties, so `fill="var(--primary)"` themes light/dark for free — the alternative
 * was two copies of the markup that drift.
 *
 * Its single claim is the one the prose cannot make as quickly: **one application creates
 * two records**. An interview booking (the employer's, done after the interview) and a
 * pipeline card (the agency's, alive for weeks), sharing a candidate and nothing else.
 * Everything downstream hangs off the pipeline card.
 *
 * `text-anchor` is set with inline `style`, never a class: a CSS `text-anchor` in a class
 * beats the SVG presentation attribute, which silently re-centres labels that were meant
 * to start at their x.
 */
export function LifecycleDiagram() {
  return (
    <figure className="w-full">
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 900 330"
          role="img"
          aria-labelledby="lifecycle-title lifecycle-desc"
          className="h-auto w-full min-w-[640px]"
        >
          <title id="lifecycle-title">The placement lifecycle</title>
          <desc id="lifecycle-desc">
            One application creates two records: an interview booking held by the employer,
            and a pipeline card held by the agency. The booking ends at the interview. The
            pipeline card continues through offer, placement, invoice and the guarantee
            period.
          </desc>

          <defs>
            <marker
              id="lc-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--border)" />
            </marker>
          </defs>

          {/* ---- the single origin ---- */}
          <g>
            <rect
              x="8"
              y="128"
              width="132"
              height="58"
              rx="10"
              fill="var(--primary)"
              opacity="0.12"
            />
            <rect
              x="8"
              y="128"
              width="132"
              height="58"
              rx="10"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="1.5"
            />
            <text
              x="74"
              y="152"
              style={{ textAnchor: "middle" }}
              fontSize="14"
              fontWeight="600"
              fill="var(--primary)"
            >
              Candidate
            </text>
            <text
              x="74"
              y="172"
              style={{ textAnchor: "middle" }}
              fontSize="13"
              fill="var(--primary)"
            >
              applies once
            </text>
          </g>

          {/* the fork */}
          <path
            d="M 140 157 L 178 157 L 178 66 L 214 66"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            markerEnd="url(#lc-arrow)"
          />
          <path
            d="M 140 157 L 178 157 L 178 248 L 214 248"
            fill="none"
            stroke="var(--border)"
            strokeWidth="1.5"
            markerEnd="url(#lc-arrow)"
          />

          {/* ---- top track: the employer's booking ---- */}
          <text
            x="214"
            y="30"
            style={{ textAnchor: "start" }}
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.08em"
            fill="var(--muted-foreground)"
          >
            EMPLOYER&rsquo;S BOOKING &mdash; DONE AFTER THE INTERVIEW
          </text>

          {[
            { x: 214, label: "Requested", sub: "no seat held" },
            { x: 372, label: "Accepted", sub: "seat locked" },
            { x: 530, label: "Interviewed", sub: "" },
          ].map((n, i, all) => (
            <g key={n.label}>
              <rect
                x={n.x}
                y="44"
                width="132"
                height="46"
                rx="8"
                fill="var(--card)"
                stroke="var(--border)"
                strokeWidth="1.5"
              />
              <text
                x={n.x + 66}
                y={n.sub ? 64 : 72}
                style={{ textAnchor: "middle" }}
                fontSize="13"
                fontWeight="600"
                fill="var(--foreground)"
              >
                {n.label}
              </text>
              {n.sub ? (
                <text
                  x={n.x + 66}
                  y="80"
                  style={{ textAnchor: "middle" }}
                  fontSize="11"
                  fill="var(--muted-foreground)"
                >
                  {n.sub}
                </text>
              ) : null}
              {i < all.length - 1 ? (
                <line
                  x1={n.x + 132}
                  y1="67"
                  x2={all[i + 1].x - 4}
                  y2="67"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  markerEnd="url(#lc-arrow)"
                />
              ) : null}
            </g>
          ))}

          {/* ---- bottom track: the agency's pipeline card ---- */}
          <text
            x="214"
            y="212"
            style={{ textAnchor: "start" }}
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.08em"
            fill="var(--muted-foreground)"
          >
            YOUR PIPELINE CARD &mdash; RUNS FOR WEEKS
          </text>

          {[
            { x: 214, label: "Pipeline" },
            { x: 344, label: "Offer" },
            { x: 474, label: "Placement" },
            { x: 604, label: "Invoice" },
            { x: 734, label: "Guarantee" },
          ].map((n, i, all) => (
            <g key={n.label}>
              <rect
                x={n.x}
                y="226"
                width="110"
                height="44"
                rx="8"
                fill={i === all.length - 1 ? "var(--muted)" : "var(--card)"}
                stroke="var(--border)"
                strokeWidth="1.5"
              />
              <text
                x={n.x + 55}
                y="253"
                style={{ textAnchor: "middle" }}
                fontSize="13"
                fontWeight="600"
                fill="var(--foreground)"
              >
                {n.label}
              </text>
              {i < all.length - 1 ? (
                <line
                  x1={n.x + 110}
                  y1="248"
                  x2={all[i + 1].x - 4}
                  y2="248"
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  markerEnd="url(#lc-arrow)"
                />
              ) : null}
            </g>
          ))}

          {/* The fork itself is the join, so the note sits on it rather than adding a
              second connector — an earlier dashed line ran straight through the lower
              track's label. */}
          <text
            x="196"
            y="161"
            style={{ textAnchor: "start" }}
            fontSize="11.5"
            fill="var(--primary)"
          >
            same candidate, separate records
          </text>

          {/* every move is written down */}
          <text
            x="214"
            y="296"
            style={{ textAnchor: "start" }}
            fontSize="11.5"
            fill="var(--muted-foreground)"
          >
            Every move adds a row. Nothing is overwritten.
          </text>
          <text
            x="214"
            y="314"
            style={{ textAnchor: "start" }}
            fontSize="11.5"
            fill="var(--muted-foreground)"
          >
            The board shows where they are. The history shows how they got there.
          </text>
        </svg>
      </div>
      <figcaption className="mx-auto mt-5 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
        The booking is done after the interview. The pipeline card is what your fee, invoice
        and guarantee hang from.
      </figcaption>
    </figure>
  );
}
