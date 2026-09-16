-- ==============================================================================
-- V3__seed_more_movies.sql
-- Thêm thể loại và danh sách 27 phim phong phú (NOW_SHOWING, COMING_SOON, ENDED)
-- ==============================================================================

-- 1. Bổ sung các thể loại phim phổ biến
INSERT INTO genres (id, name)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Action'),
    ('10000000-0000-0000-0000-000000000002', 'Adventure'),
    ('10000000-0000-0000-0000-000000000003', 'Drama'),
    ('10000000-0000-0000-0000-000000000004', 'Science Fiction'),
    ('10000000-0000-0000-0000-000000000005', 'Animation'),
    ('10000000-0000-0000-0000-000000000006', 'Comedy'),
    ('10000000-0000-0000-0000-000000000007', 'Horror'),
    ('10000000-0000-0000-0000-000000000008', 'Thriller'),
    ('10000000-0000-0000-0000-000000000009', 'Crime'),
    ('10000000-0000-0000-0000-000000000010', 'Fantasy'),
    ('10000000-0000-0000-0000-000000000011', 'Romance'),
    ('10000000-0000-0000-0000-000000000012', 'History')
ON CONFLICT (id) DO NOTHING;

-- 2. Thêm 27 phim mới (ID từ 20000000-...-0004 đến 0030)
INSERT INTO movies (
    id, title, original_title, description, duration_min, age_rating,
    release_date, poster_url, backdrop_url, trailer_url, rating, director, status
)
VALUES
    -- 04: Oppenheimer
    (
        '20000000-0000-0000-0000-000000000004',
        'Oppenheimer',
        'Oppenheimer',
        'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.',
        180, 'T18', '2023-07-21',
        'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
        'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
        'https://www.youtube.com/watch?v=uYPbbksJxIg', 8.9, 'Christopher Nolan', 'ENDED'
    ),
    -- 05: Interstellar
    (
        '20000000-0000-0000-0000-000000000005',
        'Interstellar',
        'Interstellar',
        'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked with piloting a spacecraft to find a new planet.',
        169, 'T13', '2014-11-07',
        'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
        'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
        'https://www.youtube.com/watch?v=zSWdZVtXT7E', 8.7, 'Christopher Nolan', 'ENDED'
    ),
    -- 06: Inception
    (
        '20000000-0000-0000-0000-000000000006',
        'Inception',
        'Inception',
        'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into a CEO mind.',
        148, 'T16', '2010-07-16',
        'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
        'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
        'https://www.youtube.com/watch?v=YoHD9XEInc0', 8.8, 'Christopher Nolan', 'ENDED'
    ),
    -- 07: Deadpool & Wolverine
    (
        '20000000-0000-0000-0000-000000000007',
        'Deadpool & Wolverine',
        'Deadpool & Wolverine',
        'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary behind him, until he is drawn into a new fight.',
        128, 'T18', '2024-07-26',
        'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
        'https://image.tmdb.org/t/p/original/yDHYTfaA9g94qesJQLzGVN2U23n.jpg',
        'https://www.youtube.com/watch?v=73_1biulkYk', 7.7, 'Shawn Levy', 'NOW_SHOWING'
    ),
    -- 08: Inside Out 2
    (
        '20000000-0000-0000-0000-000000000008',
        'Inside Out 2',
        'Inside Out 2',
        'Teenager Riley mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions!',
        96, 'P', '2024-06-14',
        'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
        'https://image.tmdb.org/t/p/original/stKGOmbuwhL48SAMYKKM9jEbmJL.jpg',
        'https://www.youtube.com/watch?v=LEjhY15eCx0', 7.6, 'Kelsey Mann', 'NOW_SHOWING'
    ),
    -- 09: Despicable Me 4
    (
        '20000000-0000-0000-0000-000000000009',
        'Despicable Me 4',
        'Despicable Me 4',
        'Gru and Lucy and their girls welcome a new member to the Gru family, Gru Jr., who is intent on tormenting his dad.',
        94, 'P', '2024-07-03',
        'https://image.tmdb.org/t/p/w500/wWba3TaojhK7NdycRhoQpsG0FaH.jpg',
        'https://image.tmdb.org/t/p/original/lgkFt6tcRTCgem70Y7AVjnyTio9.jpg',
        'https://www.youtube.com/watch?v=qQlr9-rF32A', 7.1, 'Chris Renaud', 'NOW_SHOWING'
    ),
    -- 10: Godzilla x Kong: The New Empire
    (
        '20000000-0000-0000-0000-000000000010',
        'Godzilla x Kong: The New Empire',
        'Godzilla x Kong: The New Empire',
        'Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world.',
        115, 'T13', '2024-03-29',
        'https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg',
        'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg',
        'https://www.youtube.com/watch?v=lV1OOlGwExg', 7.2, 'Adam Wingard', 'NOW_SHOWING'
    ),
    -- 11: Furiosa: A Mad Max Saga
    (
        '20000000-0000-0000-0000-000000000011',
        'Furiosa: A Mad Max Saga',
        'Furiosa: A Mad Max Saga',
        'As the world falls, young Furiosa is snatched from the Green Place of Many Mothers into the hands of a great Biker Horde led by Warlord Dementus.',
        148, 'T18', '2024-05-24',
        'https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xUMZ51f.jpg',
        'https://image.tmdb.org/t/p/original/wNAhuOZ3Zf84jCI5TeTVxoQwFdZ.jpg',
        'https://www.youtube.com/watch?v=XJMuhwVlca4', 7.6, 'George Miller', 'NOW_SHOWING'
    ),
    -- 12: Kingdom of the Planet of the Apes
    (
        '20000000-0000-0000-0000-000000000012',
        'Kingdom of the Planet of the Apes',
        'Kingdom of the Planet of the Apes',
        'Several generations in the future following Caesar reign, apes are now the dominant species and live harmoniously while humans are feral.',
        145, 'T13', '2024-05-10',
        'https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg',
        'https://image.tmdb.org/t/p/original/fqvXv6q9BkMLbsvdsu9tFIliAWL.jpg',
        'https://www.youtube.com/watch?v=XtFI7SNtVpY', 7.1, 'Wes Ball', 'NOW_SHOWING'
    ),
    -- 13: Kung Fu Panda 4
    (
        '20000000-0000-0000-0000-000000000013',
        'Kung Fu Panda 4',
        'Kung Fu Panda 4',
        'Po must train a new warrior when he is chosen to become the spiritual leader of the Valley of Peace while facing a shape-shifting sorceress.',
        94, 'P', '2024-03-08',
        'https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg',
        'https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg',
        'https://www.youtube.com/watch?v=_inKs4eeHiI', 7.1, 'Mike Mitchell', 'NOW_SHOWING'
    ),
    -- 14: Alien: Romulus
    (
        '20000000-0000-0000-0000-000000000014',
        'Alien: Romulus',
        'Alien: Romulus',
        'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form.',
        119, 'T18', '2024-08-16',
        'https://image.tmdb.org/t/p/w500/b33nnKl12vfwh49KiHG9v9jhUm4.jpg',
        'https://image.tmdb.org/t/p/original/9SSEUrSqhljBMzRe4aB5Y1W5xuh.jpg',
        'https://www.youtube.com/watch?v=x0XDEhP4MQs', 7.3, 'Fede Álvarez', 'NOW_SHOWING'
    ),
    -- 15: Twisters
    (
        '20000000-0000-0000-0000-000000000015',
        'Twisters',
        'Twisters',
        'As storm season intensifies, unprecedented phenomena are unleashed, and the competing teams find themselves squarely in the path of colliding systems.',
        122, 'T13', '2024-07-19',
        'https://image.tmdb.org/t/p/w500/pjnD08FlMAIXsfOLKQbvmO0f0MD.jpg',
        'https://image.tmdb.org/t/p/original/58D329744hwv2LHgTeRYMEbq9nh.jpg',
        'https://www.youtube.com/watch?v=Jb8Sbg_zSJE', 7.0, 'Lee Isaac Chung', 'NOW_SHOWING'
    ),
    -- 16: Beetlejuice Beetlejuice
    (
        '20000000-0000-0000-0000-000000000016',
        'Beetlejuice Beetlejuice',
        'Beetlejuice Beetlejuice',
        'After a family tragedy, three generations of the Deetz family return home to Winter River. Still haunted by Beetlejuice, Lydia life is turned upside down.',
        104, 'T13', '2024-09-06',
        'https://image.tmdb.org/t/p/w500/kKgQzkUCUm0meqTn6nm0GQ92ILC.jpg',
        'https://image.tmdb.org/t/p/original/xi1VSt3lflgYr16ZAvvPBa2Njvf.jpg',
        'https://www.youtube.com/watch?v=CoZqL9N6Rx4', 7.2, 'Tim Burton', 'NOW_SHOWING'
    ),
    -- 17: A Quiet Place: Day One
    (
        '20000000-0000-0000-0000-000000000017',
        'A Quiet Place: Day One',
        'A Quiet Place: Day One',
        'As New York City is invaded by alien creatures that hunt by sound, a young woman named Sam must navigate the perilous cityscape to survive.',
        99, 'T16', '2024-06-28',
        'https://image.tmdb.org/t/p/w500/hU1Q9YVzdYwh89696Q4wQp1n07R.jpg',
        'https://image.tmdb.org/t/p/original/2RVcJbWFmICRDsEjRI8zL39izIn.jpg',
        'https://www.youtube.com/watch?v=YPY7J-flzE8', 6.8, 'Michael Sarnoski', 'NOW_SHOWING'
    ),
    -- 18: Joker: Folie a Deux
    (
        '20000000-0000-0000-0000-000000000018',
        'Joker: Folie a Deux',
        'Joker: Folie à Deux',
        'Arthur Fleck is institutionalized at Arkham awaiting trial for his crimes as Joker. While struggling with his dual identity, he stumbles upon love.',
        138, 'T18', '2024-10-04',
        'https://image.tmdb.org/t/p/w500/aciP8Km0waTLGEYfmskhDYvtHgx.jpg',
        'https://image.tmdb.org/t/p/original/uGmYWVI4019QyE7z1hV0gK6Vl3H.jpg',
        'https://www.youtube.com/watch?v=_OKAwz2MsJs', 8.0, 'Todd Phillips', 'COMING_SOON'
    ),
    -- 19: Gladiator II
    (
        '20000000-0000-0000-0000-000000000019',
        'Gladiator II',
        'Gladiator II',
        'Years after witnessing the death of Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by tyrannical emperors.',
        148, 'T16', '2024-11-22',
        'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
        'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnExlogQIJuEGqh.jpg',
        'https://www.youtube.com/watch?v=4rgYUipGJNo', 8.3, 'Ridley Scott', 'COMING_SOON'
    ),
    -- 20: Moana 2
    (
        '20000000-0000-0000-0000-000000000020',
        'Moana 2',
        'Moana 2',
        'After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a new crew to the far seas of Oceania.',
        100, 'P', '2024-11-27',
        'https://image.tmdb.org/t/p/w500/4YZpsylmjHbqeWzjKpUEF8gcLUV.jpg',
        'https://image.tmdb.org/t/p/original/tElnmtQ6yz1PjN1kePNl8yMSb59.jpg',
        'https://www.youtube.com/watch?v=hDZ7y8RP5HE', 7.9, 'David G. Derrick Jr.', 'COMING_SOON'
    ),
    -- 21: Wicked
    (
        '20000000-0000-0000-0000-000000000021',
        'Wicked',
        'Wicked',
        'The untold story of the witches of Oz: Elphaba, misunderstood because of her green skin, and Glinda, popular and ambitious.',
        160, 'P', '2024-11-22',
        'https://image.tmdb.org/t/p/w500/2E1x1qcHqGZcE3i96B2yTvhS128.jpg',
        'https://image.tmdb.org/t/p/original/uLqSQ9q6P41y9Ff3fH0L1nQ2y9v.jpg',
        'https://www.youtube.com/watch?v=6COmYeLsz4c', 8.1, 'Jon M. Chu', 'COMING_SOON'
    ),
    -- 22: Mufasa: The Lion King
    (
        '20000000-0000-0000-0000-000000000022',
        'Mufasa: The Lion King',
        'Mufasa: The Lion King',
        'Told in flashbacks, Rafiki recounts the legend of Mufasa to young lion cub Kiara, joined by Timon and Pumbaa with their signature humor.',
        118, 'P', '2024-12-20',
        'https://image.tmdb.org/t/p/w500/jbOSUAWcG9v7hP60Q05m24Gg1f7.jpg',
        'https://image.tmdb.org/t/p/original/9lE71usukD9hO41eI8yFpS4j4j3.jpg',
        'https://www.youtube.com/watch?v=o17MF9vnabg', 7.8, 'Barry Jenkins', 'COMING_SOON'
    ),
    -- 23: Sonic the Hedgehog 3
    (
        '20000000-0000-0000-0000-000000000023',
        'Sonic the Hedgehog 3',
        'Sonic the Hedgehog 3',
        'Sonic, Knuckles, and Tails reunite against a powerful new adversary, Shadow, a mysterious villain with powers unlike anything they have faced.',
        110, 'P', '2024-12-20',
        'https://image.tmdb.org/t/p/w500/ny70xZlD1RzWcQy1hE7B9vB7pZ0.jpg',
        'https://image.tmdb.org/t/p/original/zOpe0eHau82zSw4naQ7ZhuNq54U.jpg',
        'https://www.youtube.com/watch?v=qSu6i2iFMO0', 8.0, 'Jeff Fowler', 'COMING_SOON'
    ),
    -- 24: The Wild Robot
    (
        '20000000-0000-0000-0000-000000000024',
        'The Wild Robot',
        'The Wild Robot',
        'After a shipwreck, an intelligent robot named Roz is stranded on an uninhabited island and must learn to adapt to the harsh surroundings.',
        102, 'P', '2024-09-27',
        'https://image.tmdb.org/t/p/w500/wTnV3PCVW5O92JQIKe1NaioLOMm.jpg',
        'https://image.tmdb.org/t/p/original/mQZJoIhTEkNhCYJsGUtY0r90pp4.jpg',
        'https://www.youtube.com/watch?v=67vbA5ZJdKQ', 8.5, 'Chris Sanders', 'COMING_SOON'
    ),
    -- 25: Captain America: Brave New World
    (
        '20000000-0000-0000-0000-000000000025',
        'Captain America: Brave New World',
        'Captain America: Brave New World',
        'Sam Wilson finds himself in the middle of an international incident after meeting with newly elected U.S. President Thaddeus Ross.',
        135, 'T13', '2025-02-14',
        'https://image.tmdb.org/t/p/w500/pzIddQEMWhWzfvLI3Twx128pZ90.jpg',
        'https://image.tmdb.org/t/p/original/kGzcvtaT88YY4Hq5zfZuXy9gC9Z.jpg',
        'https://www.youtube.com/watch?v=1pHDWnXmK7Y', 7.9, 'Julius Onah', 'COMING_SOON'
    ),
    -- 26: Avatar: The Way of Water
    (
        '20000000-0000-0000-0000-000000000026',
        'Avatar: The Way of Water',
        'Avatar: The Way of Water',
        'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started.',
        192, 'T13', '2022-12-16',
        'https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg',
        'https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg',
        'https://www.youtube.com/watch?v=d9MyW72ELq0', 7.7, 'James Cameron', 'ENDED'
    ),
    -- 27: Top Gun: Maverick
    (
        '20000000-0000-0000-0000-000000000027',
        'Top Gun: Maverick',
        'Top Gun: Maverick',
        'After more than thirty years of service as one of the Navy top aviators, Pete Maverick Mitchell is where he belongs, pushing the envelope.',
        130, 'T13', '2022-05-27',
        'https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg',
        'https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg',
        'https://www.youtube.com/watch?v=giXco2jaZ_4', 8.3, 'Joseph Kosinski', 'ENDED'
    ),
    -- 28: Avengers: Endgame
    (
        '20000000-0000-0000-0000-000000000028',
        'Avengers: Endgame',
        'Avengers: Endgame',
        'After the devastating events of Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.',
        181, 'T13', '2019-04-26',
        'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
        'https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zJW8Q9zR082n.jpg',
        'https://www.youtube.com/watch?v=TcMBFSGVi1c', 8.4, 'Anthony Russo, Joe Russo', 'ENDED'
    ),
    -- 29: Barbie
    (
        '20000000-0000-0000-0000-000000000029',
        'Barbie',
        'Barbie',
        'Barbie and Ken are having the time of their lives in the colorful and seemingly perfect world of Barbie Land before venturing into the real world.',
        114, 'T13', '2023-07-21',
        'https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg',
        'https://image.tmdb.org/t/p/original/ctMserH8g2SeOAnCw5gFjd2NTL6.jpg',
        'https://www.youtube.com/watch?v=pBk4NYhWNMM', 7.2, 'Greta Gerwig', 'ENDED'
    ),
    -- 30: Guardians of the Galaxy Vol. 3
    (
        '20000000-0000-0000-0000-000000000030',
        'Guardians of the Galaxy Vol. 3',
        'Guardians of the Galaxy Vol. 3',
        'Peter Quill, still reeling from the loss of Gamora, rallies his team to defend the universe and protect Rocket on a mission.',
        150, 'T13', '2023-05-05',
        'https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN2Ydgii51xQ.jpg',
        'https://image.tmdb.org/t/p/original/5YZbUmjbMa3ClvSW1Wj3D6XGolb.jpg',
        'https://www.youtube.com/watch?v=u3V5KDHRQvk', 8.0, 'James Gunn', 'ENDED'
    )
ON CONFLICT (id) DO NOTHING;

-- 3. Gắn thể loại cho từng phim mới
INSERT INTO movie_genres (movie_id, genre_id)
VALUES
    -- Oppenheimer (Drama, History)
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000012'),

    -- Interstellar (Adventure, Drama, Science Fiction)
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000004'),

    -- Inception (Action, Science Fiction, Adventure)
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002'),

    -- Deadpool & Wolverine (Action, Comedy, Science Fiction)
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004'),

    -- Inside Out 2 (Animation, Comedy, Adventure)
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002'),

    -- Despicable Me 4 (Animation, Comedy, Adventure)
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002'),

    -- Godzilla x Kong (Action, Science Fiction, Adventure)
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002'),

    -- Furiosa (Action, Adventure, Science Fiction)
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000004'),

    -- Kingdom of the Planet of the Apes (Science Fiction, Adventure, Action)
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001'),

    -- Kung Fu Panda 4 (Animation, Action, Comedy)
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006'),

    -- Alien: Romulus (Horror, Science Fiction, Thriller)
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000007'),
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000008'),

    -- Twisters (Action, Adventure, Thriller)
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000008'),

    -- Beetlejuice Beetlejuice (Comedy, Fantasy, Horror)
    ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000010'),
    ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000007'),

    -- A Quiet Place: Day One (Horror, Science Fiction, Thriller)
    ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000007'),
    ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000008'),

    -- Joker: Folie a Deux (Drama, Crime, Thriller)
    ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000009'),
    ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000008'),

    -- Gladiator II (Action, Adventure, Drama)
    ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000003'),

    -- Moana 2 (Animation, Adventure, Comedy)
    ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000006'),

    -- Wicked (Fantasy, Drama, Romance)
    ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000010'),
    ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000011'),

    -- Mufasa: The Lion King (Adventure, Drama, Animation)
    ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000003'),
    ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000005'),

    -- Sonic the Hedgehog 3 (Action, Adventure, Comedy)
    ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000006'),

    -- The Wild Robot (Animation, Science Fiction, Adventure)
    ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000005'),
    ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000002'),

    -- Captain America: Brave New World (Action, Adventure, Science Fiction)
    ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000004'),

    -- Avatar: The Way of Water (Science Fiction, Action, Adventure)
    ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000002'),

    -- Top Gun: Maverick (Action, Drama)
    ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000003'),

    -- Avengers: Endgame (Action, Adventure, Science Fiction)
    ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000004'),

    -- Barbie (Comedy, Adventure, Fantasy)
    ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000006'),
    ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000010'),

    -- Guardians of the Galaxy Vol. 3 (Science Fiction, Adventure, Action)
    ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000004'),
    ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000002'),
    ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
