const SITE_URL = 'https://turboglowcleaning.com.au';

const services = {
  '/services/end-of-lease-cleaning-perth/': {
    title: 'End of Lease Cleaning Perth | TurboGlow Cleaning',
    description: 'Detailed end of lease cleaning services for tenants, landlords and property managers across Perth. Request a tailored cleaning quote.',
    heading: 'End of Lease Cleaning in Perth',
    intro: 'Prepare a rental property for its final inspection with a detailed clean tailored to the property and its condition.',
    audience: 'Tenants preparing to hand back the keys, landlords preparing for new occupants, and property managers coordinating a tenancy change.',
    included: ['Kitchen surfaces, cupboards and appliance exteriors', 'Bathrooms, showers, fittings and mirrors', 'Floors, skirting boards and accessible surfaces', 'Bedrooms and living areas', 'Attention to the agreed property-specific checklist'],
    notes: 'Every property is different. Share the number of rooms, current condition and any agent checklist when requesting a quote so the scope can be confirmed before work begins.',
  },
  '/services/vacate-cleaning-perth/': {
    title: 'Vacate Cleaning Perth | TurboGlow Cleaning',
    description: 'Professional vacate cleaning for homes and rental properties across Perth. Arrange a tailored moving-out cleaning quote.',
    heading: 'Vacate Cleaning in Perth',
    intro: 'Leave the cleaning to us while you concentrate on packing, moving and handing over the property.',
    audience: 'People moving from a rental or owned home, landlords, real estate professionals and property managers.',
    included: ['Detailed kitchen and bathroom cleaning', 'Dusting of accessible surfaces and fixtures', 'Vacuuming and mopping appropriate floor surfaces', 'Bedrooms, living spaces and common areas', 'Optional items discussed during quoting'],
    notes: 'For the best result, remove personal belongings before the appointment and tell us about areas that need particular attention.',
  },
  '/services/house-cleaning-perth/': {
    title: 'House Cleaning Perth | Regular Home Cleaning | TurboGlow',
    description: 'Flexible house cleaning services across Perth for regular upkeep and busy households. Ask TurboGlow Cleaning for a personalised quote.',
    heading: 'House Cleaning in Perth',
    intro: 'Keep your home comfortable with a cleaning plan shaped around its layout, usage and your priorities.',
    audience: 'Busy households, families, professionals and anyone who would like help maintaining their home.',
    included: ['Kitchen and bathroom surface cleaning', 'Dusting accessible furniture and surfaces', 'Vacuuming and floor cleaning', 'Bedrooms and shared living spaces', 'A scope agreed before the first clean'],
    notes: 'Tell us which rooms matter most and whether you are seeking a one-time visit or an ongoing schedule.',
  },
  '/services/deep-cleaning-perth/': {
    title: 'Deep Cleaning Perth | One-Off Home Cleaning | TurboGlow',
    description: 'One-off deep cleaning services for Perth homes that need extra attention. Request a quote based on your rooms and cleaning priorities.',
    heading: 'Deep Cleaning in Perth',
    intro: 'A more detailed one-off clean for homes that need attention beyond routine upkeep.',
    audience: 'Households preparing for visitors, seasonal cleaning, post-event refreshing or restarting a regular cleaning routine.',
    included: ['Detailed attention to kitchens and bathrooms', 'Dust and build-up removal from agreed accessible areas', 'Vacuuming and appropriate hard-floor cleaning', 'Room-by-room priority work', 'Optional tasks confirmed in the quote'],
    notes: 'Photos or a clear description help us understand the condition of the home and recommend enough time for the requested work.',
  },
  '/services/commercial-cleaning-perth/': {
    title: 'Commercial Cleaning Perth | Office Cleaning | TurboGlow',
    description: 'Commercial and office cleaning services tailored to Perth workplaces. Discuss your premises, schedule and cleaning requirements.',
    heading: 'Commercial Cleaning in Perth',
    intro: 'Maintain a presentable workplace with a cleaning scope and schedule tailored to your premises.',
    audience: 'Offices and commercial premises seeking one-off, periodic or regular cleaning support.',
    included: ['Work areas and shared spaces', 'Kitchenette and washroom cleaning', 'Dusting and accessible surface cleaning', 'Vacuuming and appropriate floor care', 'A site-specific schedule agreed during quoting'],
    notes: 'Provide the floor area, business hours, access requirements and preferred frequency so we can discuss a practical plan.',
  },
  '/services/carpet-cleaning-perth/': {
    title: 'Carpet Cleaning Perth | TurboGlow Cleaning',
    description: 'Carpet cleaning options for Perth homes, rentals and commercial properties. Contact TurboGlow to discuss carpet condition and access.',
    heading: 'Carpet Cleaning in Perth',
    intro: 'Refresh carpeted areas as part of a broader property clean or as a separately discussed service.',
    audience: 'Homeowners, tenants, landlords, property managers and commercial premises with carpeted spaces.',
    included: ['Assessment of carpeted rooms and access', 'Discussion of visible marks and priority areas', 'A scope based on carpet type and condition', 'Coordination with vacate or deep cleaning when requested', 'Clear preparation guidance before the appointment'],
    notes: 'Some stains or carpet conditions require specialist assessment. Send details and photos so expectations and the appropriate approach can be discussed.',
  },
  '/services/window-cleaning-perth/': {
    title: 'Window Cleaning Perth | TurboGlow Cleaning',
    description: 'Window cleaning for accessible windows in Perth homes and commercial properties. Request a quote based on property size and access.',
    heading: 'Window Cleaning in Perth',
    intro: 'Improve the presentation of your property with window cleaning scoped around the number, size and accessibility of the windows.',
    audience: 'Homes, rental properties and commercial premises seeking window cleaning alone or with another cleaning service.',
    included: ['An assessment of window count and accessibility', 'Accessible glass surfaces included in the agreed scope', 'Frames or tracks when specifically agreed', 'Coordination with vacate and deep cleans', 'Safety and access requirements confirmed before booking'],
    notes: 'High, difficult-to-access or specialist windows may need a separate assessment. Include photos when requesting a quote.',
  },
};

const standardPages = {
  '/about/': {
    title: 'About TurboGlow Cleaning | Perth Cleaning Team',
    description: 'Learn about TurboGlow Cleaning and our approach to residential, rental and commercial cleaning across Perth, Western Australia.',
    heading: 'About TurboGlow Cleaning',
    intro: 'TurboGlow Cleaning provides residential, rental and commercial cleaning services across Perth, Western Australia.',
    body: ['We focus on clear communication, a scope shaped around each property, and careful attention to the areas agreed with the customer.', 'Our services include end of lease, vacate, regular house, deep, carpet, window and commercial cleaning. Contact us with your property details and priorities for a tailored quote.'],
  },
  '/contact/': {
    title: 'Contact TurboGlow Cleaning | Cleaning Quotes Perth',
    description: 'Contact TurboGlow Cleaning for residential, vacate and commercial cleaning quotes across Perth, Western Australia.',
    heading: 'Contact TurboGlow Cleaning',
    intro: 'Tell us about your property, preferred service and cleaning priorities for a tailored quote.',
    body: ['Call 0494 061 234 or 0426 472 488 during office hours, or email info@turboglowcleaning.com.au.', 'For the most accurate response, include the suburb, property type, number of rooms, requested service and preferred date.'],
  },
  '/reviews/': {
    title: 'TurboGlow Cleaning Reviews | Perth Customers',
    description: 'Find out how to review TurboGlow Cleaning and what to consider when choosing a cleaner for your Perth property.',
    heading: 'Customer Feedback',
    intro: 'Customer feedback helps us understand what worked well and where we can improve.',
    body: ['We do not publish invented or unverified testimonials. Genuine customer reviews will be added here with permission as they become available.', 'When comparing cleaning services, look for clear scope, responsive communication, realistic expectations and a quote relevant to your property.'],
  },
  '/service-areas/perth/': {
    title: 'Cleaning Services Perth WA | TurboGlow Cleaning',
    description: 'Explore residential, vacate and commercial cleaning services available across Perth, Western Australia.',
    heading: 'Cleaning Services Across Perth',
    intro: 'TurboGlow Cleaning serves customers across Perth, Western Australia, subject to availability and the requirements of each job.',
    body: ['We support homes, rental properties and commercial premises with end of lease, vacate, regular house, deep, carpet, window and commercial cleaning.', 'Include your suburb when requesting a quote so travel, timing and availability can be confirmed. We only create dedicated suburb information when we can provide genuinely useful local details.'],
  },
};

const allPaths = [...Object.keys(services), ...Object.keys(standardPages)];

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function pageShell({ title, description, heading, intro, content, pathname, schema }) {
  const canonical = `${SITE_URL}${pathname}`;
  return `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:locale" content="en_AU"><meta property="og:site_name" content="TurboGlow Cleaning"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${SITE_URL}/img/logoImg.png">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<style>:root{--navy:#001f54;--deep:#0a1128;--gold:#ffd700;--ink:#172033;--muted:#596477}*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);line-height:1.65;background:#f7f9fc}header{background:var(--deep);color:#fff}nav{max-width:1120px;margin:auto;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem}.brand{display:flex;align-items:center;color:#fff;text-decoration:none;font-weight:800}.brand img{width:46px;height:46px;object-fit:contain;margin-right:.65rem}.nav{display:flex;gap:1.1rem;flex-wrap:wrap}.nav a{color:#fff;text-decoration:none}.hero{background:linear-gradient(135deg,var(--deep),var(--navy));color:#fff;padding:5rem 1.25rem}.wrap{max-width:960px;margin:auto}.crumbs{font-size:.9rem;margin-bottom:1.2rem}.crumbs a{color:#fff}.hero h1{font-size:clamp(2.2rem,6vw,4rem);line-height:1.08;margin:.25rem 0 1rem}.hero p{max-width:720px;font-size:1.2rem}.content{padding:3.5rem 1.25rem}.grid{display:grid;grid-template-columns:2fr 1fr;gap:2rem}.card{background:#fff;border-radius:18px;padding:1.6rem;box-shadow:0 8px 28px rgba(0,31,84,.08);margin-bottom:1.4rem}h2{color:var(--navy);line-height:1.2}li{margin:.55rem 0}.cta{background:var(--navy);color:#fff;position:sticky;top:1rem}.cta h2{color:#fff}.button{display:inline-block;background:var(--gold);color:var(--deep);padding:.8rem 1.1rem;border-radius:999px;text-decoration:none;font-weight:800;margin:.3rem .3rem .3rem 0}.button.alt{background:#fff}footer{background:var(--deep);color:#fff;padding:2rem 1.25rem;margin-top:2rem}footer a{color:#fff}@media(max-width:760px){.grid{grid-template-columns:1fr}.nav{display:none}.hero{padding:3.5rem 1.25rem}.cta{position:static}}</style></head>
<body><header><nav><a class="brand" href="/"><img src="/img/logoImg.png" alt="TurboGlow Cleaning logo">TurboGlow Cleaning</a><div class="nav"><a href="/">Home</a><a href="/about/">About</a><a href="/service-areas/perth/">Perth Services</a><a href="/reviews/">Reviews</a><a href="/contact/">Contact</a></div></nav></header>
<main><section class="hero"><div class="wrap"><div class="crumbs"><a href="/">Home</a> / ${escapeHtml(heading)}</div><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(intro)}</p></div></section><section class="content"><div class="wrap grid"><div>${content}</div><aside><div class="card cta"><h2>Request a free quote</h2><p>Tell us about your property, suburb and cleaning priorities.</p><a class="button" href="/#contact">Get a quote</a><a class="button alt" href="tel:+61494061234">Call 0494 061 234</a></div></aside></div></section></main>
<footer><div class="wrap">TurboGlow Cleaning · Perth, Western Australia · <a href="mailto:info@turboglowcleaning.com.au">info@turboglowcleaning.com.au</a></div></footer></body></html>`;
}

function renderSeoPage(pathname) {
  const service = services[pathname];
  if (service) {
    const content = `<section class="card"><h2>Who this service is for</h2><p>${escapeHtml(service.audience)}</p></section><section class="card"><h2>What can be included</h2><ul>${service.included.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p>The final inclusions are confirmed in your quote.</p></section><section class="card"><h2>How booking works</h2><ol><li>Send your property details and preferred date.</li><li>We clarify the scope, access and priority areas.</li><li>You receive a quote based on the information provided.</li><li>Once confirmed, the clean is completed to the agreed scope.</li></ol></section><section class="card"><h2>Before requesting a quote</h2><p>${escapeHtml(service.notes)}</p></section>`;
    const schema = { '@context': 'https://schema.org', '@type': 'Service', name: service.heading, description: service.description, areaServed: { '@type': 'City', name: 'Perth' }, provider: { '@type': 'Organization', name: 'TurboGlow Cleaning', url: SITE_URL, telephone: '+61 494 061 234' }, url: `${SITE_URL}${pathname}` };
    return pageShell({ ...service, pathname, content, schema });
  }
  const page = standardPages[pathname];
  if (!page) return null;
  const servicesList = pathname === '/service-areas/perth/' ? `<section class="card"><h2>Services available</h2><ul>${Object.entries(services).map(([url, item]) => `<li><a href="${url}">${escapeHtml(item.heading)}</a></li>`).join('')}</ul></section>` : '';
  const contactLinks = pathname === '/contact/' ? '<section class="card"><h2>Request a quote online</h2><p><a class="button" href="/#contact">Open the quote form</a></p></section>' : '';
  const content = `<section class="card">${page.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>${servicesList}${contactLinks}`;
  const schema = { '@context': 'https://schema.org', '@type': 'WebPage', name: page.heading, description: page.description, url: `${SITE_URL}${pathname}`, isPartOf: { '@type': 'WebSite', name: 'TurboGlow Cleaning', url: SITE_URL } };
  return pageShell({ ...page, pathname, content, schema });
}

module.exports = { allPaths, renderSeoPage };
