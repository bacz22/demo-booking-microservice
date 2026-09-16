import type {
  AdminMovie,
  AdminMovieStatus,
  MovieFilterState,
  MovieFormData,
  MoviePaginationResult,
} from '@/types/admin-movie'

const STORAGE_KEY = 'cinebook_admin_movies'

const INITIAL_ADMIN_MOVIES: AdminMovie[] = [
  {
    id: 'dune-part-two',
    title: 'Dune: Hành Tinh Cát - Phần Hai',
    originalTitle: 'Dune: Part Two',
    overview:
      'Paul Atreides hợp lực cùng Chani và tộc người Fremen khi anh tìm kiếm sự báo thù chống lại những kẻ âm mưu đã hủy diệt gia tộc mình. Đứng trước sự lựa chọn giữa tình yêu của đời mình và số phận của vũ trụ, anh nỗ lực ngăn chặn một tương lai đen tối.',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    duration: 166,
    releaseDate: '2024-03-01',
    ageRating: 'T16',
    genres: ['Khoa học viễn tưởng', 'Hành động', 'Phiêu lưu'],
    rating: 8.9,
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    status: 'now-showing',
    showtimeCount: 42,
    updatedAt: '2026-09-14 17:18',
    createdAt: '2024-02-15 09:00',
  },
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
    trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
    duration: 180,
    releaseDate: '2023-08-11',
    ageRating: 'T18',
    genres: ['Tiểu sử', 'Lịch sử', 'Kịch tính'],
    rating: 9.1,
    director: 'Christopher Nolan',
    cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon', 'Robert Downey Jr.'],
    status: 'now-showing',
    showtimeCount: 28,
    updatedAt: '2026-09-12 14:30',
    createdAt: '2023-07-20 10:00',
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
    trailerUrl: 'https://www.youtube.com/watch?v=lV1OOlGwExg',
    duration: 115,
    releaseDate: '2024-03-29',
    ageRating: 'T13',
    genres: ['Hành động', 'Khoa học viễn tưởng'],
    rating: 7.8,
    director: 'Adam Wingard',
    cast: ['Rebecca Hall', 'Brian Tyree Henry', 'Dan Stevens'],
    status: 'now-showing',
    showtimeCount: 35,
    updatedAt: '2026-09-14 14:30',
    createdAt: '2024-03-10 11:15',
  },
  {
    id: 'exhuma',
    title: 'Exhuma: Quật Mộ Trùng Ma',
    originalTitle: 'Exhuma',
    overview:
      'Một gia đình tài phiệt gốc Hàn tại Los Angeles trải qua hàng loạt sự kiện siêu nhiên kỳ bí, buộc hai pháp sư trẻ, một chuyên gia phong thủy và một người làm nghề mai táng phải khai quật ngôi mộ bí ẩn.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=xT65k512Qrk',
    duration: 134,
    releaseDate: '2024-03-15',
    ageRating: 'T16',
    genres: ['Kinh dị', 'Bí ẩn', 'Hồi hộp'],
    rating: 8.4,
    director: 'Jang Jae-hyun',
    cast: ['Choi Min-sik', 'Kim Go-eun', 'Yoo Hae-jin', 'Lee Do-hyun'],
    status: 'now-showing',
    showtimeCount: 30,
    updatedAt: '2026-09-13 16:20',
    createdAt: '2024-03-01 08:30',
  },
  {
    id: 'kung-fu-panda-4',
    title: 'Kung Fu Panda 4',
    originalTitle: 'Kung Fu Panda 4',
    overview:
      'Po chuẩn bị trở thành Thủ lĩnh Tinh thần của Thung lũng Bình Yên và cần tìm kiếm người kế thừa danh hiệu Thần Long Đại Hiệp, đồng thời phải đối đầu với mụ phù thủy biến hình Chameleon độc ác.',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=_inKs4eeHiI',
    duration: 94,
    releaseDate: '2024-03-08',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hành động', 'Hài hước', 'Gia đình'],
    rating: 7.6,
    director: 'Mike Mitchell',
    cast: ['Jack Black', 'Awkwafina', 'Viola Davis', 'Dustin Hoffman'],
    status: 'now-showing',
    showtimeCount: 24,
    updatedAt: '2026-09-11 10:45',
    createdAt: '2024-02-20 14:00',
  },
  {
    id: 'mai',
    title: 'Mai',
    originalTitle: 'Mai',
    overview:
      'Mai - một phụ nữ làm nghề massage trị liệu ở tuổi ngoài 30 chịu nhiều tổn thương và định kiến xã hội, bất ngờ gặp gỡ và mở lòng với Dương - chàng trai trẻ lãng tử sống cùng khu chung cư.',
    posterUrl:
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=fX62bHnZJqw',
    duration: 131,
    releaseDate: '2024-02-10',
    ageRating: 'T18',
    genres: ['Tâm lý', 'Lãng mạn', 'Kịch tính'],
    rating: 8.2,
    director: 'Trấn Thành',
    cast: ['Phương Anh Đào', 'Tuấn Trần', 'Hồng Đào', 'Trấn Thành'],
    status: 'now-showing',
    showtimeCount: 18,
    updatedAt: '2026-09-10 18:00',
    createdAt: '2024-01-15 09:30',
  },
  {
    id: 'deadpool-and-wolverine',
    title: 'Deadpool & Wolverine',
    originalTitle: 'Deadpool & Wolverine',
    overview:
      'Wade Wilson bị Cơ quan Quản lý Phương sai Thời gian kéo ra khỏi cuộc sống yên bình để thực hiện một sứ mệnh mới, buộc anh phải hợp tác với Wolverine đang ẩn dật nhằm giải cứu vũ trụ.',
    posterUrl:
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=73_1biulkYk',
    duration: 127,
    releaseDate: '2026-10-26',
    ageRating: 'T18',
    genres: ['Hành động', 'Hài hước', 'Siêu anh hùng'],
    rating: 8.7,
    director: 'Shawn Levy',
    cast: ['Ryan Reynolds', 'Hugh Jackman', 'Emma Corrin'],
    status: 'coming-soon',
    showtimeCount: 0,
    updatedAt: '2026-09-08 11:20',
    createdAt: '2026-08-01 15:00',
  },
  {
    id: 'planet-of-the-apes',
    title: 'Hành Tinh Khỉ: Vương Quốc Mới',
    originalTitle: 'Kingdom of the Planet of the Apes',
    overview:
      'Nhiều thế hệ sau triều đại của Caesar, loài khỉ trở thành giống loài thống lĩnh thế giới, trong khi con người bị đẩy vào thế giới hoang dã bóng tối.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=Kdr5oedn7q8',
    duration: 145,
    releaseDate: '2026-11-10',
    ageRating: 'T16',
    genres: ['Hành động', 'Khoa học viễn tưởng'],
    rating: 8.1,
    director: 'Wes Ball',
    cast: ['Owen Teague', 'Freya Allan', 'Kevin Durand'],
    status: 'coming-soon',
    showtimeCount: 0,
    updatedAt: '2026-09-05 09:10',
    createdAt: '2026-08-10 14:00',
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
    trailerUrl: 'https://www.youtube.com/watch?v=YPY7J-flzE8',
    duration: 100,
    releaseDate: '2026-11-28',
    ageRating: 'T16',
    genres: ['Kinh dị', 'Hồi hộp', 'Khoa học viễn tưởng'],
    rating: 7.9,
    director: 'Michael Sarnoski',
    cast: ['Lupita Nyong\'o', 'Joseph Quinn', 'Alex Wolff'],
    status: 'coming-soon',
    showtimeCount: 0,
    updatedAt: '2026-09-02 14:15',
    createdAt: '2026-08-15 11:00',
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
    trailerUrl: 'https://www.youtube.com/watch?v=qQlr9-rF32A',
    duration: 95,
    releaseDate: '2026-12-05',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hài hước', 'Gia đình'],
    rating: 7.5,
    director: 'Chris Renaud',
    cast: ['Steve Carell', 'Kristen Wiig', 'Will Ferrell'],
    status: 'coming-soon',
    showtimeCount: 0,
    updatedAt: '2026-09-01 16:40',
    createdAt: '2026-08-20 10:00',
  },
  {
    id: 'spider-man-across-the-spider-verse',
    title: 'Spider-Man: Du Hành Vũ Trụ Nhện',
    originalTitle: 'Spider-Man: Across the Spider-Verse',
    overview:
      'Miles Morales tái xuất trong chương tiếp theo của vũ trụ Người Nhện đoạt giải Oscar, cùng Gwen Stacy du hành qua Đa vũ trụ và đụng độ Hội Nhện đa chiều.',
    posterUrl:
      'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=cqGjhVJWtEg',
    duration: 140,
    releaseDate: '2023-06-02',
    ageRating: 'P',
    genres: ['Hoạt hình', 'Hành động', 'Khoa học viễn tưởng'],
    rating: 8.9,
    director: 'Joaquim Dos Santos',
    cast: ['Shameik Moore', 'Hailee Steinfeld', 'Oscar Isaac'],
    status: 'ended',
    showtimeCount: 0,
    updatedAt: '2026-08-15 10:00',
    createdAt: '2023-05-10 09:00',
  },
  {
    id: 'past-lives',
    title: 'Muôn Kiếp Nhân Duyên',
    originalTitle: 'Past Lives',
    overview:
      'Nora và Hae Sung - hai người bạn thân thời thơ ấu sâu sắc tại Hàn Quốc - bị chia cắt sau khi gia đình Nora di cư, tái ngộ tại New York sau hai thập kỷ định mệnh.',
    posterUrl:
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=kA244xewjcI',
    duration: 105,
    releaseDate: '2023-09-29',
    ageRating: 'T13',
    genres: ['Lãng mạn', 'Kịch tính', 'Tâm lý'],
    rating: 8.0,
    director: 'Celine Song',
    cast: ['Greta Lee', 'Teo Yoo', 'John Magaro'],
    status: 'ended',
    showtimeCount: 0,
    updatedAt: '2026-08-10 15:30',
    createdAt: '2023-09-01 11:00',
  },
  {
    id: 'avatar-the-way-of-water',
    title: 'Avatar: Dòng Chảy Của Nước',
    originalTitle: 'Avatar: The Way of Water',
    overview:
      'Jake Sully sống cùng gia đình mới được thành lập trên mặt trăng Pandora. Một mối đe dọa quen thuộc quay trở lại để kết thúc những gì đã bắt đầu trước đây.',
    posterUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
    duration: 192,
    releaseDate: '2022-12-16',
    ageRating: 'T13',
    genres: ['Khoa học viễn tưởng', 'Hành động', 'Phiêu lưu'],
    rating: 7.8,
    director: 'James Cameron',
    cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver'],
    status: 'ended',
    showtimeCount: 0,
    updatedAt: '2026-07-20 09:00',
    createdAt: '2022-11-20 14:00',
  },
  {
    id: 'top-gun-maverick',
    title: 'Phi Công Siêu Đẳng Maverick',
    originalTitle: 'Top Gun: Maverick',
    overview:
      'Sau hơn ba mươi năm phục vụ với tư cách là một trong những phi công hàng đầu của Hải quân, Pete Mitchell đối mặt với quá khứ của mình khi huấn luyện biệt đội.',
    posterUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    backdropUrl:
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80',
    trailerUrl: 'https://www.youtube.com/watch?v=giXco2jaZ_4',
    duration: 130,
    releaseDate: '2022-05-27',
    ageRating: 'T13',
    genres: ['Hành động', 'Kịch tính'],
    rating: 8.3,
    director: 'Joseph Kosinski',
    cast: ['Tom Cruise', 'Miles Teller', 'Jennifer Connelly'],
    status: 'ended',
    showtimeCount: 0,
    updatedAt: '2026-07-15 16:00',
    createdAt: '2022-05-01 10:00',
  },
]

function getStoredMovies(): AdminMovie[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // Ignored
  }
  return INITIAL_ADMIN_MOVIES
}

function saveMovies(movies: AdminMovie[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies))
  } catch {
    // Ignored
  }
}

export function getAllGenres(): string[] {
  const movies = getStoredMovies()
  const genreSet = new Set<string>()
  movies.forEach((m) => {
    m.genres.forEach((g) => genreSet.add(g))
  })
  return Array.from(genreSet).sort((a, b) => a.localeCompare(b, 'vi'))
}

export async function getAdminMovies(
  filters: Partial<MovieFilterState>
): Promise<MoviePaginationResult> {
  // Giả lập độ trễ mạng ngắn 150ms
  await new Promise((resolve) => setTimeout(resolve, 150))

  const allMovies = getStoredMovies()

  const search = (filters.search || '').trim().toLowerCase()
  const status = filters.status || 'all'
  const genre = filters.genre || 'all'
  const ageRating = filters.ageRating || 'all'
  const sortBy = filters.sortBy || 'releaseDate'
  const sortOrder = filters.sortOrder || 'desc'
  const page = Math.max(Number(filters.page) || 1, 1)
  const pageSize = Math.max(Number(filters.pageSize) || 10, 1)

  let filtered = allMovies.filter((movie) => {
    // Search keyword
    if (search) {
      const titleMatch = movie.title.toLowerCase().includes(search)
      const origMatch = (movie.originalTitle || '').toLowerCase().includes(search)
      if (!titleMatch && !origMatch) return false
    }

    // Status filter
    if (status !== 'all' && movie.status !== status) {
      return false
    }

    // Genre filter
    if (genre !== 'all' && !movie.genres.includes(genre)) {
      return false
    }

    // Age Rating filter
    if (ageRating !== 'all' && movie.ageRating !== ageRating) {
      return false
    }

    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'title') {
      cmp = a.title.localeCompare(b.title, 'vi')
    } else if (sortBy === 'updatedAt') {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    } else if (sortBy === 'releaseDate') {
      cmp = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
    }
    return sortOrder === 'asc' ? cmp : -cmp
  })

  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize) || 1
  const startIdx = (page - 1) * pageSize
  const items = filtered.slice(startIdx, startIdx + pageSize)

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  }
}

export async function getAdminMovieById(id: string): Promise<AdminMovie | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))
  const movies = getStoredMovies()
  return movies.find((m) => m.id === id) || null
}

export async function createAdminMovie(data: MovieFormData): Promise<AdminMovie> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const movies = getStoredMovies()

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = `${dateStr} ${now.toTimeString().slice(0, 5)}`

  // Tạo slug id
  const baseSlug = data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'movie'

  let finalId = baseSlug
  let count = 1
  while (movies.some((m) => m.id === finalId)) {
    finalId = `${baseSlug}-${count++}`
  }

  const castArray = typeof data.cast === 'string'
    ? data.cast.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const newMovie: AdminMovie = {
    id: finalId,
    title: data.title.trim(),
    originalTitle: data.originalTitle.trim() || undefined,
    overview: data.overview.trim() || undefined,
    posterUrl: data.posterUrl.trim(),
    backdropUrl: data.backdropUrl.trim() || undefined,
    trailerUrl: data.trailerUrl.trim() || undefined,
    duration: Number(data.duration) || 120,
    releaseDate: data.releaseDate,
    ageRating: data.ageRating,
    genres: data.genres,
    director: data.director.trim() || undefined,
    cast: castArray,
    status: data.status,
    showtimeCount: 0,
    updatedAt: timeStr,
    createdAt: timeStr,
  }

  movies.unshift(newMovie)
  saveMovies(movies)
  return newMovie
}

export async function updateAdminMovie(
  id: string,
  data: MovieFormData
): Promise<AdminMovie> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const movies = getStoredMovies()
  const idx = movies.findIndex((m) => m.id === id)

  if (idx === -1) {
    throw new Error(`Không tìm thấy phim có mã ${id}`)
  }

  const now = new Date()
  const timeStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`

  const castArray = typeof data.cast === 'string'
    ? data.cast.split(',').map((s) => s.trim()).filter(Boolean)
    : []

  const updatedMovie: AdminMovie = {
    ...movies[idx],
    title: data.title.trim(),
    originalTitle: data.originalTitle.trim() || undefined,
    overview: data.overview.trim() || undefined,
    posterUrl: data.posterUrl.trim(),
    backdropUrl: data.backdropUrl.trim() || undefined,
    trailerUrl: data.trailerUrl.trim() || undefined,
    duration: Number(data.duration) || 120,
    releaseDate: data.releaseDate,
    ageRating: data.ageRating,
    genres: data.genres,
    director: data.director.trim() || undefined,
    cast: castArray,
    status: data.status,
    updatedAt: timeStr,
  }

  movies[idx] = updatedMovie
  saveMovies(movies)
  return updatedMovie
}

export async function updateMovieStatus(
  id: string,
  status: AdminMovieStatus
): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  const movies = getStoredMovies()
  const movie = movies.find((m) => m.id === id)
  if (!movie) return false

  const now = new Date()
  movie.status = status
  movie.updatedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`
  saveMovies(movies)
  return true
}

export async function archiveMovie(id: string): Promise<boolean> {
  return updateMovieStatus(id, 'ended')
}

export async function bulkUpdateMovieStatus(
  ids: string[],
  status: AdminMovieStatus
): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 250))
  const movies = getStoredMovies()
  const idSet = new Set(ids)
  let updatedCount = 0

  const now = new Date()
  const timeStr = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)}`

  movies.forEach((m) => {
    if (idSet.has(m.id)) {
      m.status = status
      m.updatedAt = timeStr
      updatedCount++
    }
  })

  if (updatedCount > 0) {
    saveMovies(movies)
  }
  return updatedCount
}

export async function bulkArchiveMovies(ids: string[]): Promise<number> {
  return bulkUpdateMovieStatus(ids, 'ended')
}

export function resetMoviesToDefault(): void {
  saveMovies(INITIAL_ADMIN_MOVIES)
}
