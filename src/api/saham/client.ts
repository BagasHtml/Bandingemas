// Kerangka client bursa saham (idx-pulse): endpoint UI-nya belum ada.
// Bentuk fungsi mengikuti emas/client.ts akan ditambahkan saat fitur
// saham benar-benar dimulai.
import axios from 'axios'

export const sahamClient = axios.create({
  baseURL: 'https://idx-pulse.vercel.app/api',
  timeout: 15_000,
})
