import { Telegraf, Markup } from 'telegraf'
import axios from 'axios'
import mongoose from 'mongoose'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const __dirname = path.dirname(fileURLToPath(import.meta.url))

app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

const bot = new Telegraf('7950384030:AAEPCHqcQMdFW53pqKrJHA3vD14-f-Mk-bM')

mongoose.connect("mongodb+srv://toshidev0:zcode22107@dbtxt.3dxoaud.mongodb.net/TIKTOKXL")

const videoSchema = new mongoose.Schema({}, { strict: false })
const Video = mongoose.model("Video", videoSchema)

const userSchema = new mongoose.Schema({
  user_id: Number,
  username: String,
  first_name: String,
  last_name: String,
  downloads: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
})
const User = mongoose.model('User', userSchema)

const userSessions = new Map()

function toMathSans(text) {
  const mathSansMap = {
    'a': '𝖺', 'b': '𝖻', 'c': '𝖼', 'd': '𝖽', 'e': '𝖾', 'f': '𝖿', 'g': '𝗀', 'h': '𝗁', 'i': '𝗂', 'j': '𝗃', 'k': '𝗄', 'l': '𝗅', 'm': '𝗆', 'n': '𝗇', 'o': '𝗈', 'p': '𝗉', 'q': '𝗊', 'r': '𝗋', 's': '𝗌', 't': '𝗍', 'u': '𝗎', 'v': '𝗏', 'w': '𝗐', 'x': '𝗑', 'y': '𝗒', 'z': '𝗓',
    'A': '𝖠', 'B': '𝖡', 'C': '𝖢', 'D': '𝖣', 'E': '𝖤', 'F': '𝖥', 'G': '𝖦', 'H': '𝖧', 'I': '𝖨', 'J': '𝖩', 'K': '𝖪', 'L': '𝖫', 'M': '𝖬', 'N': '𝖭', 'O': '𝖮', 'P': '𝖯', 'Q': '𝖰', 'R': '𝖱', 'S': '𝖲', 'T': '𝖳', 'U': '𝖴', 'V': '𝖵', 'W': '𝖶', 'X': '𝖷', 'Y': '𝖸', 'Z': '𝖹',
    '0': '𝟢', '1': '𝟣', '2': '𝟤', '3': '𝟥', '4': '𝟦', '5': '𝟧', '6': '𝟨', '7': '𝟩', '8': '𝟪', '9': '𝟫'
  }
  return text.split('').map(char => mathSansMap[char] || char).join('')
}

function getMainMenuKeyboard() {
  return Markup.keyboard([
    ['📥 Download TikTok', 'ℹ️ Help'],
    ['📊 My Stats', '👨‍💻 Developer'],
    ['💝 Donate', '🔄 Refresh Menu']
  ]).resize()
}

function getCommandButtons() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('📥 Download', 'menu_download'),
      Markup.button.callback('ℹ️ Help', 'menu_help')
    ],
    [
      Markup.button.callback('📊 Stats', 'menu_stats'),
      Markup.button.callback('👨‍💻 Dev', 'menu_developer')
    ],
    [
      Markup.button.callback('💝 Donate', 'menu_donate'),
      Markup.button.callback('🔄 Refresh', 'menu_refresh')
    ]
  ])
}

function getDownloadButtons(userId) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('🚫 No Watermark', `nowatermark:${userId}`),
      Markup.button.callback('💧 With Watermark', `watermark:${userId}`)
    ],
    [
      Markup.button.callback('🎵 Audio Only', `audio:${userId}`),
      Markup.button.callback('📋 Back to Menu', 'menu_back')
    ]
  ])
}

async function trackUser(ctx) {
  const user = ctx.from
  const existingUser = await User.findOne({ user_id: user.id })
  if (!existingUser) {
    await User.create({
      user_id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name
    })
  }
}

bot.start(async (ctx) => {
  await trackUser(ctx)
  const welcomeText = toMathSans(`🎉 Welcome to TikTok Downloader Bot! 🎵

🚀 Simply send me a TikTok video URL and I will download it for you.

📋 Choose an option below or use the quick action buttons:`)

  await ctx.reply(welcomeText, getMainMenuKeyboard())
  await ctx.reply(toMathSans('⚡ Quick Actions:'), getCommandButtons())
})

bot.hears('📥 Download TikTok', async (ctx) => {
  await ctx.reply(toMathSans('📩 Please send me a TikTok video URL to download.\n\nSupported URLs:\n• https://vm.tiktok.com/...\n• https://www.tiktok.com/...\n• https://tiktok.com/...'))
})

bot.hears('ℹ️ Help', async (ctx) => {
  await trackUser(ctx)
  const helpText = toMathSans(`📖 How to use:

1️⃣ Copy any TikTok video URL
2️⃣ Paste and send it to this bot
3️⃣ Choose download option
4️⃣ Wait for processing
5️⃣ Download your video!

✨ Features:
• 🚫 Download without watermark
• 💧 Download with watermark  
• 🎵 Audio extraction only
• 📱 HD quality available

🔗 Supported URLs:
• https://vm.tiktok.com/...
• https://www.tiktok.com/...
• https://tiktok.com/...`)

  await ctx.reply(helpText, getCommandButtons())
})

bot.hears('📊 My Stats', async (ctx) => {
  await trackUser(ctx)
  const totalUsers = await User.countDocuments()
  const totalDownloads = await User.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }])
  const userStats = await User.findOne({ user_id: ctx.from.id })

  const statsText = toMathSans(`📊 Bot Statistics

👥 Total Users: ${totalUsers}
📥 Total Downloads: ${totalDownloads[0]?.total || 0}
🎯 Your Downloads: ${userStats?.downloads || 0}
🆔 Your ID: ${ctx.from.id}
📅 Member Since: ${userStats ? new Date(userStats.created_at).toLocaleDateString() : 'Today'}`)

  await ctx.reply(statsText, getCommandButtons())
})

bot.hears('👨‍💻 Developer', async (ctx) => {
  await trackUser(ctx)
  const devText = toMathSans(`👨‍💻 Developer Information

🤖 Bot Created by: ToshiDev
📞 Telegram ID: 8183360446
📧 Username: @toshidev0
💼 Experience: Full Stack Developer

🛠️ Technologies Used:
• Node.js & Telegraf
• MongoDB Database
• TikTok API Integration
• Express.js Server

💝 If you find this bot useful, consider supporting the development!`)

  await ctx.reply(devText, getCommandButtons())
})

bot.hears('💝 Donate', async (ctx) => {
  await trackUser(ctx)
  const donateText = toMathSans(`💝 Support Development

🙏 If you enjoy using this bot and want to support its development and maintenance, you can donate via:

📱 GCash: 09923605092
👤 Account Name: Toshi Dev

🎯 Your donation helps:
• 🔄 Maintain server costs
• 🚀 Add new features  
• 🐛 Fix bugs quickly
• 📈 Improve performance

❤️ Thank you for your support! Every donation matters! 🙏`)

  await ctx.reply(donateText, getCommandButtons())
})

bot.hears('🔄 Refresh Menu', async (ctx) => {
  await ctx.reply(toMathSans('🔄 Menu refreshed successfully!'), getMainMenuKeyboard())
  await ctx.reply(toMathSans('⚡ Quick Actions:'), getCommandButtons())
})

bot.action('menu_download', async (ctx) => {
  await ctx.editMessageText(toMathSans('📩 Please send me a TikTok video URL to download.\n\nSupported URLs:\n• https://vm.tiktok.com/...\n• https://www.tiktok.com/...\n• https://tiktok.com/...'), getCommandButtons())
})

bot.action('menu_help', async (ctx) => {
  const helpText = toMathSans(`📖 How to use:

1️⃣ Copy TikTok URL
2️⃣ Send to bot
3️⃣ Choose option
4️⃣ Wait & Download

✨ Features:
• 🚫 No watermark
• 💧 With watermark  
• 🎵 Audio only
• 📱 HD quality`)

  await ctx.editMessageText(helpText, getCommandButtons())
})

bot.action('menu_stats', async (ctx) => {
  await trackUser(ctx)
  const totalUsers = await User.countDocuments()
  const totalDownloads = await User.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }])
  const userStats = await User.findOne({ user_id: ctx.from.id })

  const statsText = toMathSans(`📊 Your Statistics

👥 Total Users: ${totalUsers}
📥 Total Downloads: ${totalDownloads[0]?.total || 0}
🎯 Your Downloads: ${userStats?.downloads || 0}
🆔 Your ID: ${ctx.from.id}`)

  await ctx.editMessageText(statsText, getCommandButtons())
})

bot.action('menu_developer', async (ctx) => {
  const devText = toMathSans(`👨‍💻 Developer Info

🤖 Created by: ToshiDev
📞 ID: 8183360446
📧 @toshidev0

💝 Consider supporting development!`)

  await ctx.editMessageText(devText, getCommandButtons())
})

bot.action('menu_donate', async (ctx) => {
  const donateText = toMathSans(`💝 Support Development

📱 GCash: 09923605092
👤 Name: Toshi Dev

❤️ Your support helps maintain this bot!`)

  await ctx.editMessageText(donateText, getCommandButtons())
})

bot.action('menu_refresh', async (ctx) => {
  await ctx.editMessageText(toMathSans('🔄 Menu refreshed!'), getCommandButtons())
})

bot.action('menu_back', async (ctx) => {
  await ctx.editMessageText(toMathSans('🏠 Main Menu:'), getCommandButtons())
})

bot.command('help', async (ctx) => {
  await trackUser(ctx)
  const helpText = toMathSans(`📖 How to use:

1️⃣ Copy TikTok URL
2️⃣ Send to bot  
3️⃣ Choose option
4️⃣ Download video

✨ All features available!`)

  await ctx.reply(helpText, getCommandButtons())
})

bot.command('stats', async (ctx) => {
  await trackUser(ctx)
  const totalUsers = await User.countDocuments()
  const totalDownloads = await User.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }])
  const userStats = await User.findOne({ user_id: ctx.from.id })

  const statsText = toMathSans(`📊 Your Statistics

👥 Total Users: ${totalUsers}
📥 Total Downloads: ${totalDownloads[0]?.total || 0}
🎯 Your Downloads: ${userStats?.downloads || 0}`)

  await ctx.reply(statsText, getCommandButtons())
})

bot.command('developer', async (ctx) => {
  await trackUser(ctx)
  const devText = toMathSans(`👨‍💻 Developer

🤖 ToshiDev
📞 8183360446
📧 @toshidev0`)

  await ctx.reply(devText, getCommandButtons())
})

bot.command('donate', async (ctx) => {
  await trackUser(ctx)
  const donateText = toMathSans(`💝 Donate

📱 GCash: 09923605092
👤 Toshi Dev

❤️ Thank you!`)

  await ctx.reply(donateText, getCommandButtons())
})

bot.command('about', async (ctx) => {
  await trackUser(ctx)
  const aboutText = toMathSans(`🤖 TikTok Downloader Bot

🚀 Version: 2.0 Enhanced
📅 Launched: 2024
👨‍💻 Developer: ToshiDev
🔧 Technology: Node.js + MongoDB

✨ Features:
• High-quality downloads
• Multiple format options
• Fast processing
• User statistics`)

  await ctx.reply(aboutText, getCommandButtons())
})

function isTikTokUrl(url) {
  const tiktokPatterns = [
    /https?:\/\/(vm|vt)\.tiktok\.com\/[A-Za-z0-9]+/,
    /https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9_.]+\/video\/[0-9]+/,
    /https?:\/\/(www\.)?tiktok\.com\/t\/[A-Za-z0-9]+\/?/
  ]
  return tiktokPatterns.some(pattern => pattern.test(url))
}

bot.on('text', async (ctx) => {
  await trackUser(ctx)
  const message = ctx.message.text

  if (message.startsWith('/')) return

  if (!isTikTokUrl(message)) {
    return ctx.reply(toMathSans('❌ Please send a valid TikTok URL.\n\nUse the Help button for instructions.'), getCommandButtons())
  }

  try {
    userSessions.set(ctx.from.id, { url: message })

    ctx.reply(toMathSans('🎯 Choose download option:'), getDownloadButtons(ctx.from.id))
  } catch (error) {
    ctx.reply(toMathSans('❌ Error processing request'), getCommandButtons())
  }
})

bot.action(/nowatermark:(\d+)/, async (ctx) => {
  const userId = ctx.match[1]
  await handleDownload(ctx, userId, false, false)
})

bot.action(/watermark:(\d+)/, async (ctx) => {
  const userId = ctx.match[1]
  await handleDownload(ctx, userId, true, false)
})

bot.action(/audio:(\d+)/, async (ctx) => {
  const userId = ctx.match[1]
  await handleDownload(ctx, userId, false, true)
})

async function handleDownload(ctx, userId, watermark = false, audioOnly = false) {
  try {
    const userSession = userSessions.get(parseInt(userId))
    if (!userSession || !userSession.url) {
      await ctx.editMessageText(toMathSans('❌ Session expired. Please send the URL again.'), getCommandButtons())
      return
    }

    const url = userSession.url
    const processingMsg = await ctx.editMessageText(toMathSans('⏳ Processing your request...\n\n📥 Downloading video data...'))

    const apiUrl = "https://www.tikwm.com/api/"
    const response = await axios.post(apiUrl, { url, hd: 1 })

    if (response.data.code !== 0) {
      await ctx.editMessageText(toMathSans('❌ Failed to fetch video.\n\nPlease check the URL and try again.'), getCommandButtons())
      return
    }

    const data = response.data.data
    data.source_url = url
    if (data.id) {
      data.tiktok_id = data.id
      delete data.id
    }

    const saved = new Video(data)
    await saved.save()

    await User.updateOne(
      { user_id: parseInt(userId) },
      { $inc: { downloads: 1 } }
    )

    await ctx.editMessageText(toMathSans('✅ Video processed!\n\n📤 Sending now...'))

    const author = data.author?.nickname || data.author?.unique_id || data.author || 'Unknown'
    const title = data.title || 'TikTok Video'
    const likes = data.digg_count || data.likes || data.stats?.digg_count || 0
    const comments = data.comment_count || data.stats?.comment_count || 0
    const shares = data.share_count || data.stats?.share_count || 0
    const playCount = data.play_count || data.stats?.play_count || 0

    let downloadUrl
    let caption = toMathSans(`🎵 ${title}

👤 𝖠𝗎𝗍𝗁𝗈𝗋: ${author}
❤️ 𝖫𝗂𝗄𝖾𝗌: ${likes}
💬 𝖢𝗈𝗆𝗆𝖾𝗇𝗍𝗌: ${comments}
🔄 𝖲𝗁𝖺𝗋𝖾𝗌: ${shares}
👀 𝖵𝗂𝖾𝗐𝗌: ${playCount}

✅ 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝖽 𝗏𝗂𝖺 @${ctx.botInfo.username}`)

    if (audioOnly && data.music) {
      downloadUrl = data.music
      caption = toMathSans(`🎵 ${title}

👤 𝖠𝗎𝗍𝗁𝗈𝗋: ${author}
🎶 𝖠𝗎𝖽𝗂𝗈 𝖤𝗑𝗍𝗋𝖺𝖼𝗍𝖾𝖽

✅ 𝖣𝗈𝗐𝗇𝗅𝗈𝖺𝖽𝖾𝖽 𝗏𝗂𝖺 @${ctx.botInfo.username}`)
      await ctx.replyWithAudio(downloadUrl, { caption })
    } else if (watermark && data.wmplay) {
      downloadUrl = data.wmplay
      await ctx.replyWithVideo(downloadUrl, { caption })
    } else if (data.play) {
      downloadUrl = data.play
      await ctx.replyWithVideo(downloadUrl, { caption })
    } else {
      await ctx.editMessageText(toMathSans('❌ No download URL found'), getCommandButtons())
      return
    }

    await ctx.deleteMessage(processingMsg.message_id)
    userSessions.delete(parseInt(userId))

  } catch (error) {
    console.error('Download error:', error)
    await ctx.editMessageText(toMathSans('❌ Error downloading video.\n\nPlease try again with a different URL.'), getCommandButtons())
  }
}

app.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalDownloads = await User.aggregate([{ $group: { _id: null, total: { $sum: "$downloads" } } }])
    const recentUsers = await User.find().sort({ created_at: -1 }).limit(10)

    const stats = {
      total_users: totalUsers,
      total_downloads: totalDownloads[0]?.total || 0,
      recent_users: recentUsers.map(user => ({
        id: user.user_id,
        username: user.username,
        first_name: user.first_name,
        downloads: user.downloads,
        joined: user.created_at
      }))
    }

    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'))
})

app.get('/', (req, res) => {
  res.json({ 
    message: 'TikTok Downloader Bot API',
    status: 'Running',
    developer: 'ToshiDev',
    endpoints: {
      stats: '/stats',
      dashboard: '/dashboard'
    }
  })
})

app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'))

bot.launch().then(() => {
  console.log('🤖 TikTok Downloader Bot is running!')
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))