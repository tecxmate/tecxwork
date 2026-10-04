-- Points the fictional demo employers at their generated logo and gallery art.
-- Assets are served from public/demo/, matching the existing /company-logos/
-- convention, so no blob or R2 credentials are involved.
--
-- Run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f attach-demo-brand-assets.sql

BEGIN;

WITH slugs(company, slug) AS (
  VALUES
    ('Nimbus Silicon',           'nimbus-silicon'),
    ('Lantern Bay Digital',      'lantern-bay'),
    ('Verdant Systems',          'verdant-systems'),
    ('Riverstone Robotics',      'riverstone-robotics'),
    ('Copperline Precision',     'copperline'),
    ('Cedar Harbor Consulting',  'cedar-harbor'),
    ('Meridian Trust Capital',   'meridian-trust'),
    ('Blue Heron Foods',         'blue-heron-foods'),
    ('Willow Peak Health',       'willow-peak'),
    ('Stonebridge Construction', 'stonebridge'),
    ('Orchid Grove Hospitality', 'orchid-grove'),
    ('Compass Point Education',  'compass-point')
)
UPDATE recruiters r SET
  logo_url = '/demo/logos/' || s.slug || '.png',
  gallery_urls = ARRAY[
    '/demo/gallery/' || s.slug || '-1.jpg',
    '/demo/gallery/' || s.slug || '-2.jpg',
    '/demo/gallery/' || s.slug || '-3.jpg'
  ]
FROM slugs s
WHERE r.company = s.company;

COMMIT;
