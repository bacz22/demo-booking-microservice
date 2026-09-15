import type { Movie } from '@/types/movie'

export const HERO_MOVIE: Movie = {
  id: 'dune-part-two',
  title: 'Dune: Hành Tinh Cát - Phần Hai',
  originalTitle: 'Dune: Part Two',
  overview:
    'Paul Atreides hợp lực cùng Chani và tộc người Fremen khi anh tìm kiếm sự báo thù chống lại những kẻ âm mưu đã hủy diệt gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, anh nỗ lực ngăn chặn một tương lai đen tối khủng khiếp.',
  posterUrl:
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
  backdropUrl:
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
  trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
  duration: 166,
  releaseDate: '01/03/2024',
  ageRating: 'T16',
  genres: ['Khoa học viễn tưởng', 'Hành động', 'Phiêu lưu'],
  rating: 8.9,
  director: 'Denis Villeneuve',
  cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
  status: 'now-showing',
}

export const NOW_SHOWING_MOVIES: Movie[] = [
  HERO_MOVIE,
  {
    id: 'oppenheimer',
    title: 'Oppenheimer',
    originalTitle: 'Oppenheimer',
    overview:
      'Câu chuyện về nhà vật lý lý thuyết người Mỹ J. Robert Oppenheimer, người đóng vai trò tối quan trọng trong Dự án Manhattan - nơi phát triển những quả bom nguyên tử đầu tiên trong Thế chiến thứ hai.',
    posterUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    duration: 180,
    releaseDate: '11/08/2023',
    ageRating: 'T18',
    genres: ['Tiểu sử', 'Lịch sử', 'Kịch tính'],
    rating: 9.1,
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    status: 'now-showing',
  },
  {
    id: 'godzilla-x-kong',
    title: 'Godzilla x Kong: Đế Chế Mới',
    originalTitle: 'Godzilla x Kong: The New Empire',
    overview:
      'Hai người khổng lồ cổ đại Godzilla và Kong bước vào cuộc chiến sinh tồn đối đầu với một mối đe dọa khổng lồ chưa từng thấy ẩn sâu trong Trái Đất Rỗng, thách thức sự tồn vong của chính loài người.',
    posterUrl:
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    duration: 115,
    releaseDate: '29/03/2024',
    ageRating: 'T13',
    genres: ['Hành động', 'Khoa học viễn tưởng'],
    rating: 7.8,
    director: 'Adam Wingard',
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens'],
    status: 'now-showing',
  },
  {
    id: 'kung-fu-panda-4',
    title: 'Kung Fu Panda 4',
    originalTitle: 'Kung Fu Panda 4',
    overview:
      'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và cần tìm kiếm người kế nhiệm vị trí Chiến binh Rồng, đồng thời đối đầu với mụ phù thủy Tắc Kè Hoa có khả năng biến hình nguy hiểm.',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80',
    duration: 94,
    releaseDate: '08/03/2024',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hài hước', 'Võ thuật'],
    rating: 7.6,
    director: 'Mike Mitchell',
    cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Dustin Hoffman'],
    status: 'now-showing',
  },
  {
    id: 'lat-mat-7',
    title: 'Lật Mặt 7: Một Điều Ước',
    originalTitle: 'Face Off 7: One Wish',
    overview:
      'Câu chuyện cảm động về đại gia đình bà Hai 73 tuổi sống một mình tại một làng quê nghèo. Khi bà không may gặp tai nạn gãy chân, năm người con trưởng thành đã cùng bàn bạc cách chăm sóc mẹ già.',
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1600&auto=format&fit=crop&q=80',
    duration: 138,
    releaseDate: '26/04/2024',
    ageRating: 'P',
    genres: ['Gia đình', 'Tâm lý', 'Hài'],
    rating: 8.4,
    director: 'Lý Hải',
    cast: ['Thanh Hiền', 'Trương Minh Cường', 'Đinh Y Nhung', 'Quách Ngọc Tuyên'],
    status: 'now-showing',
  },
]

export const COMING_SOON_MOVIES: Movie[] = [
  {
    id: 'deadpool-wolverine',
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    overview:
      'Wade Wilson bị Cơ quan Quản lý Phương sai Thời gian kéo ra khỏi cuộc sống yên bình để thực hiện một sứ mệnh mới, buộc anh phải hợp tác với Wolverine đang ẩn dật nhằm giải cứu vũ trụ.',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    duration: 127,
    ageRating: 'T18',
    genres: ['Hành động', 'Hài hước', 'Siêu anh hùng'],
    rating: 8.7,
    releaseDate: '26/07/2024',
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    status: 'coming-soon',
  },
  {
    id: 'planet-of-the-apes',
    title: 'Hành Tinh Khỉ: Vương Quốc Mới',
    originalTitle: 'Kingdom of the Planet of the Apes',
    overview:
      'Nhiều thế hệ sau triều đại của Caesar, loài khỉ trở thành giống loài thống trị thống lĩnh thế giới, trong khi con người bị đẩy vào thế giới hoang dã bóng tối.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    duration: 145,
    ageRating: 'T16',
    genres: ['Hành động', 'Khoa học viễn tưởng'],
    rating: 8.1,
    releaseDate: '10/05/2024',
    director: 'Wes Ball',
    cast: ['Owen Teague', 'Freya Allan', 'Kevin Durand'],
    status: 'coming-soon',
  },
  {
    id: 'a-quiet-place-day-one',
    title: 'Vùng Đất Câm Lặng: Ngày Một',
    originalTitle: 'A Quiet Place: Day One',
    overview:
      'Trải nghiệm ngày thế giới rơi vào im lặng tuyệt đối khi những sinh vật ngoài hành tinh khát máu với thính giác siêu phàm lần đầu tiên đổ bộ tấn công Trái Đất.',
    posterUrl:
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1600&auto=format&fit=crop&q=80',
    duration: 100,
    ageRating: 'T16',
    genres: ['Kinh dị', 'Hồi hộp', 'Khoa học viễn tưởng'],
    rating: 7.9,
    releaseDate: '28/06/2024',
    director: 'Michael Sarnoski',
    cast: ['Lupita Nyong\'o', 'Joseph Quinn', 'Alex Wolff'],
    status: 'coming-soon',
  },
  {
    id: 'despicable-me-4',
    title: 'Kẻ Trộm Mặt Trăng 4',
    originalTitle: 'Despicable Me 4',
    overview:
      'Gru và đại gia đình cùng đoàn quân Minions tinh nghịch chào đón thành viên mới Gru Jr., đồng thời phải bước vào cuộc phiêu lưu trốn chạy kẻ thù truyền kiếp Maxime Le Mal.',
    posterUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&auto=format&fit=crop&q=80',
    duration: 95,
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hài hước', 'Gia đình'],
    rating: 7.5,
    releaseDate: '05/07/2024',
    director: 'Chris Renaud',
    cast: ['Steve Carell', 'Kristen Wiig', 'Will Ferrell'],
    status: 'coming-soon',
  },
  {
    id: 'inside-out-2',
    title: 'Những Mảnh Ghép Cảm Xúc 2',
    originalTitle: 'Inside Out 2',
    overview:
      'Riley bước vào tuổi dậy thì với trụ sở cảm xúc bất ngờ bị cải tạo để chào đón những người bạn cảm xúc hoàn toàn mới, dẫn đầu bởi Lo Âu (Anxiety).',
    posterUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80',
    duration: 100,
    ageRating: 'P',
    genres: ['Hoạt hình', 'Gia đình', 'Tâm lý'],
    rating: 8.6,
    releaseDate: '14/06/2024',
    director: 'Kelsey Mann',
    cast: ['Amy Poehler', 'Maya Hawke', 'Kensington Tallman'],
    status: 'coming-soon',
  },
]

export const FEATURED_MOVIES: Movie[] = [
  HERO_MOVIE,
  NOW_SHOWING_MOVIES[1],
  COMING_SOON_MOVIES[0],
  NOW_SHOWING_MOVIES[4],
  COMING_SOON_MOVIES[4],
]

export const ALL_MOVIES: Movie[] = [
  ...NOW_SHOWING_MOVIES,
  ...COMING_SOON_MOVIES,
]

export function getMovieById(movieId: string): Movie | undefined {
  return ALL_MOVIES.find((m) => m.id === movieId)
}
