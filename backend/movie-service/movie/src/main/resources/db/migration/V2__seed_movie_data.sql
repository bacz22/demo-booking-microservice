INSERT INTO genres (id, name)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Action'),
    ('10000000-0000-0000-0000-000000000002', 'Adventure'),
    ('10000000-0000-0000-0000-000000000003', 'Drama'),
    ('10000000-0000-0000-0000-000000000004', 'Science Fiction')
ON CONFLICT (id) DO NOTHING;

INSERT INTO movies (
    id, title, original_title, description, duration_min, age_rating,
    release_date, poster_url, backdrop_url, trailer_url, rating, director, status
)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'Dune: Part Two',
        'Dune: Part Two',
        'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
        166, 'T13', '2024-03-01',
        'https://image.tmdb.org/t/p/w500/1pdfLvKBbL1kZ1VdZqX3Y2GzJkT.jpg',
        'https://image.tmdb.org/t/p/original/8uVKf17pyInOWaDkc7jZc9pPZ8J.jpg',
        'https://www.youtube.com/watch?v=Way9Dexny3w', 8.7, 'Denis Villeneuve', 'NOW_SHOWING'
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'Spider-Man: Across the Spider-Verse',
        'Spider-Man: Across the Spider-Verse',
        'Miles Morales travels across the multiverse and encounters a team of Spider-People charged with protecting its existence.',
        140, 'T13', '2023-06-02',
        'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
        'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
        'https://www.youtube.com/watch?v=cqGjhVJWtEg', 8.6, 'Joaquim Dos Santos', 'NOW_SHOWING'
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'The Batman',
        'The Batman',
        'Batman investigates a string of cryptic crimes that expose corruption and a hidden connection to his own family.',
        176, 'T16', '2022-03-04',
        'https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg',
        'https://image.tmdb.org/t/p/original/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg',
        'https://www.youtube.com/watch?v=mQQ3BdjCc4U', 8.2, 'Matt Reeves', 'ENDED'
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO movie_genres (movie_id, genre_id)
VALUES
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
