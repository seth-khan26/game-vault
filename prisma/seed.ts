import { PrismaClient, Platform, ProductStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create genres
  const genres = await Promise.all([
    prisma.genre.upsert({ where: { slug: 'action-adventure' }, update: {}, create: { name: 'Action-Adventure', slug: 'action-adventure' } }),
    prisma.genre.upsert({ where: { slug: 'rpg' }, update: {}, create: { name: 'RPG', slug: 'rpg' } }),
    prisma.genre.upsert({ where: { slug: 'action-rpg' }, update: {}, create: { name: 'Action-RPG', slug: 'action-rpg' } }),
    prisma.genre.upsert({ where: { slug: 'fps' }, update: {}, create: { name: 'FPS', slug: 'fps' } }),
    prisma.genre.upsert({ where: { slug: 'sports' }, update: {}, create: { name: 'Sports', slug: 'sports' } }),
    prisma.genre.upsert({ where: { slug: 'racing' }, update: {}, create: { name: 'Racing', slug: 'racing' } }),
    prisma.genre.upsert({ where: { slug: 'fighting' }, update: {}, create: { name: 'Fighting', slug: 'fighting' } }),
    prisma.genre.upsert({ where: { slug: 'platformer' }, update: {}, create: { name: 'Platformer', slug: 'platformer' } }),
    prisma.genre.upsert({ where: { slug: 'survival-horror' }, update: {}, create: { name: 'Survival Horror', slug: 'survival-horror' } }),
    prisma.genre.upsert({ where: { slug: 'roguelike' }, update: {}, create: { name: 'Roguelike', slug: 'roguelike' } }),
    prisma.genre.upsert({ where: { slug: 'action' }, update: {}, create: { name: 'Action', slug: 'action' } }),
  ])

  const genreMap: Record<string, string> = {}
  genres.forEach((g) => { genreMap[g.slug] = g.id })

  // Create users
  const adminHash = await bcrypt.hash('Admin123!', 12)
  const customerHash = await bcrypt.hash('Customer123!', 12)

  await prisma.user.upsert({
    where: { email: 'admin@gamevault.com' },
    update: {},
    create: {
      email: 'admin@gamevault.com',
      name: 'Admin User',
      password: adminHash,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      password: customerHash,
      role: 'CUSTOMER',
    },
  })

  console.log('Users created')

  // Define games
  const games = [
    {
      title: "Spider-Man: Miles Morales",
      slug: "spider-man-miles-morales",
      description: "Experience the rise of Miles Morales as the new hero masters incredible, explosive new powers to become his own Spider-Man and save Marvel's New York.",
      developer: "Insomniac Games",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2020-11-12'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-adventure'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-SMM-PS4', price: 39.99, inventory: 75 },
        { platform: Platform.PS5, sku: 'GV-SMM-PS5', price: 49.99, inventory: 120 },
      ],
    },
    {
      title: "God of War Ragnarök",
      slug: "god-of-war-ragnarok",
      description: "Kratos and Atreus must journey to each of the Nine Realms in search of answers as Asgardian forces prepare for a prophesied battle that will end the world.",
      developer: "Santa Monica Studio",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2022-11-09'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-adventure'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-GOWR-PS4', price: 49.99, inventory: 60 },
        { platform: Platform.PS5, sku: 'GV-GOWR-PS5', price: 69.99, inventory: 150 },
      ],
    },
    {
      title: "Demon's Souls",
      slug: "demons-souls",
      description: "A remake of the classic action-RPG. Face fearsome monsters in a fallen kingdom of Boletaria where the demon plague threatens all of humanity.",
      developer: "Bluepoint Games",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2020-11-12'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['rpg', 'action-rpg'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-DS-PS5', price: 39.99, inventory: 45 },
      ],
    },
    {
      title: "Returnal",
      slug: "returnal",
      description: "Break the cycle of chaos in this third-person shooter roguelike. Fight through a hostile planet that changes with every death.",
      developer: "Housemarque",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2021-04-30'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['action', 'roguelike'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-RET-PS5', price: 59.99, inventory: 30 },
      ],
    },
    {
      title: "Ghost of Tsushima",
      slug: "ghost-of-tsushima",
      description: "In the late 13th century, the Mongol empire has laid waste to the island of Tsushima. You are one of the last samurai standing, and you must choose your own path.",
      developer: "Sucker Punch Productions",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2020-07-17'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-adventure'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-GOT-PS4', price: 39.99, inventory: 90 },
        { platform: Platform.PS5, sku: 'GV-GOT-PS5', price: 49.99, inventory: 80 },
      ],
    },
    {
      title: "Horizon Forbidden West",
      slug: "horizon-forbidden-west",
      description: "Join Aloy as she braves the Forbidden West, a majestic but dangerous frontier that conceals mysterious new threats.",
      developer: "Guerrilla Games",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2022-02-18'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-rpg'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-HFW-PS4', price: 49.99, inventory: 55 },
        { platform: Platform.PS5, sku: 'GV-HFW-PS5', price: 69.99, inventory: 110 },
      ],
    },
    {
      title: "Gran Turismo 7",
      slug: "gran-turismo-7",
      description: "The most authentic racing experience comes to PS4 and PS5. Prepare for the ultimate celebration of car culture.",
      developer: "Polyphony Digital",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2022-03-04'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['racing'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-GT7-PS4', price: 49.99, inventory: 40 },
        { platform: Platform.PS5, sku: 'GV-GT7-PS5', price: 69.99, inventory: 85 },
      ],
    },
    {
      title: "Ratchet & Clank: Rift Apart",
      slug: "ratchet-and-clank-rift-apart",
      description: "Go dimension-hopping with Ratchet and Clank as they take on an evil emperor from another reality. A showcase for what the PS5 can do.",
      developer: "Insomniac Games",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2021-06-11'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action', 'platformer'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-RCRA-PS5', price: 39.99, inventory: 70 },
      ],
    },
    {
      title: "Final Fantasy XVI",
      slug: "final-fantasy-xvi",
      description: "Enter the dark fantasy world of Valisthea and experience the latest mainline entry in the legendary Final Fantasy series.",
      developer: "Square Enix",
      publisher: "Square Enix",
      releaseDate: new Date('2023-06-22'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['rpg', 'action'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-FF16-PS5', price: 59.99, inventory: 3 },
      ],
    },
    {
      title: "Elden Ring",
      slug: "elden-ring",
      description: "A new fantasy action-RPG from FromSoftware and George R. R. Martin. Rise, Tarnished, and be guided by grace to brandish the power of the Elden Ring.",
      developer: "FromSoftware",
      publisher: "Bandai Namco Entertainment",
      releaseDate: new Date('2022-02-25'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-rpg'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-ER-PS4', price: 49.99, inventory: 100 },
        { platform: Platform.PS5, sku: 'GV-ER-PS5', price: 59.99, inventory: 180 },
      ],
    },
    {
      title: "Call of Duty: Modern Warfare III",
      slug: "call-of-duty-modern-warfare-iii",
      description: "Modern Warfare III is the direct sequel to MWII. Captain Price and the Task Force 141 face their greatest threat yet.",
      developer: "Sledgehammer Games",
      publisher: "Activision",
      releaseDate: new Date('2023-11-10'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['fps'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-CODMW3-PS4', price: 59.99, inventory: 2 },
        { platform: Platform.PS5, sku: 'GV-CODMW3-PS5', price: 69.99, inventory: 5 },
      ],
    },
    {
      title: "EA Sports FC 24",
      slug: "ea-sports-fc-24",
      description: "EA SPORTS FC 24 represents the future of football simulation with HyperMotionV technology and the most authentic virtual footballers ever created.",
      developer: "EA Vancouver",
      publisher: "Electronic Arts",
      releaseDate: new Date('2023-09-29'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['sports'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-FC24-PS4', price: 39.99, inventory: 60 },
        { platform: Platform.PS5, sku: 'GV-FC24-PS5', price: 69.99, inventory: 130 },
      ],
    },
    {
      title: "The Last of Us Part I",
      slug: "the-last-of-us-part-i",
      description: "Experience the emotional storytelling and evolved gameplay of the original The Last of Us, rebuilt for PlayStation 5.",
      developer: "Naughty Dog",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2022-09-02'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['action-adventure', 'survival-horror'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-TLOU1-PS5', price: 49.99, inventory: 65 },
      ],
    },
    {
      title: "Hogwarts Legacy",
      slug: "hogwarts-legacy",
      description: "Hogwarts Legacy is an immersive, open-world action RPG set in the world first introduced in the Harry Potter books.",
      developer: "Avalanche Software",
      publisher: "Warner Bros. Games",
      releaseDate: new Date('2023-02-10'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['action-rpg'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-HL-PS4', price: 49.99, inventory: 45 },
        { platform: Platform.PS5, sku: 'GV-HL-PS5', price: 59.99, inventory: 90 },
      ],
    },
    {
      title: "Mortal Kombat 1",
      slug: "mortal-kombat-1",
      description: "Mortal Kombat 1 heralds the dawn of a new era in the iconic franchise, courtesy of Fire God Liu Kang. A new timeline. New destiny.",
      developer: "NetherRealm Studios",
      publisher: "Warner Bros. Games",
      releaseDate: new Date('2023-09-19'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['fighting'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-MK1-PS5', price: 69.99, inventory: 4 },
      ],
    },
    {
      title: "Stellar Blade",
      slug: "stellar-blade",
      description: "Stellar Blade is a stunning action game following Eve as she fights to reclaim Earth from a mysterious enemy.",
      developer: "Shift Up",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2024-04-26'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-SB-PS5', price: 69.99, inventory: 55 },
      ],
    },
    {
      title: "Baldur's Gate 3",
      slug: "baldurs-gate-3",
      description: "Gather your party and return to the Forgotten Realms in a tale of fellowship and betrayal, sacrifice and survival in Baldur's Gate 3.",
      developer: "Larian Studios",
      publisher: "Larian Studios",
      releaseDate: new Date('2023-12-06'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['rpg'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-BG3-PS5', price: 59.99, inventory: 85 },
      ],
    },
    {
      title: "Street Fighter 6",
      slug: "street-fighter-6",
      description: "Street Fighter 6 represents the next evolution of fighting games with the new Drive System and World Tour mode.",
      developer: "Capcom",
      publisher: "Capcom",
      releaseDate: new Date('2023-06-02'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['fighting'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-SF6-PS4', price: 49.99, inventory: 30 },
        { platform: Platform.PS5, sku: 'GV-SF6-PS5', price: 59.99, inventory: 70 },
      ],
    },
    {
      title: "Resident Evil 4 Remake",
      slug: "resident-evil-4-remake",
      description: "Resident Evil 4 Remake is a reimagining of the 2005 classic, modernized while maintaining the tense atmosphere that made the original legendary.",
      developer: "Capcom",
      publisher: "Capcom",
      releaseDate: new Date('2023-03-24'),
      status: ProductStatus.ACTIVE,
      isFeatured: false,
      genres: ['survival-horror', 'action'],
      variants: [
        { platform: Platform.PS4, sku: 'GV-RE4R-PS4', price: 49.99, inventory: 50 },
        { platform: Platform.PS5, sku: 'GV-RE4R-PS5', price: 59.99, inventory: 100 },
      ],
    },
    {
      title: "Marvel's Wolverine",
      slug: "marvels-wolverine",
      description: "An all-new Marvel's Wolverine game from Insomniac Games. Experience the adrenaline rush of being Logan.",
      developer: "Insomniac Games",
      publisher: "Sony Interactive Entertainment",
      releaseDate: new Date('2024-12-31'),
      status: ProductStatus.ACTIVE,
      isFeatured: true,
      genres: ['action-adventure'],
      variants: [
        { platform: Platform.PS5, sku: 'GV-WLV-PS5', price: 79.99, inventory: 1 },
      ],
    },
  ]

  console.log(`Creating ${games.length} games...`)

  for (const game of games) {
    const titleForImage = encodeURIComponent(game.title.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 20))

    await prisma.product.upsert({
      where: { slug: game.slug },
      update: {},
      create: {
        title: game.title,
        slug: game.slug,
        description: game.description,
        developer: game.developer,
        publisher: game.publisher,
        releaseDate: game.releaseDate,
        status: game.status,
        isFeatured: game.isFeatured,
        images: {
          create: [
            {
              url: `https://placehold.co/400x500/18181B/7C3AED?text=${titleForImage}`,
              alt: game.title,
              isPrimary: true,
              sortOrder: 0,
            },
          ],
        },
        genres: {
          connect: game.genres.map((slug) => ({ id: genreMap[slug] })).filter(Boolean),
        },
        variants: {
          create: game.variants.map((v) => ({
            platform: v.platform,
            sku: v.sku,
            price: v.price,
            inventory: v.inventory,
          })),
        },
      },
    })
  }

  console.log('Seed completed successfully!')
  console.log(`Created ${games.length} products`)
  console.log('Demo accounts:')
  console.log('  Admin: admin@gamevault.com / Admin123!')
  console.log('  Customer: john@example.com / Customer123!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
