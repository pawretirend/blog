const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const cheerio = require('cheerio');

const token = '7077164519:AAHSCVQFKnTqziIYQoXf9ugLKlm7mM0grGA';

// Inisialisasi bot menggunakan token
const bot = new TelegramBot(token, { polling: true });

// Tangani pesan yang diterima oleh bot
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Periksa apakah pesan mengandung tautan
    if (msg.entities && msg.entities.some(entity => entity.type === 'url')) {
        const link = msg.text; // Ambil link dari pesan
        try {
            // Baca konten HTML dari file
            let htmlContent = fs.readFileSync('index.html', 'utf8');
            const $ = cheerio.load(htmlContent);
            
            // Tambahkan link ke dalam file HTML
            $('body').append(`<a href="${link}">${link}</a><br>`);
            
            // Simpan perubahan kembali ke dalam file
            fs.writeFileSync('index.html', $.html());

            // Kirim pesan balasan
            bot.sendMessage(chatId, `Link ${link} telah ditambahkan ke tampilan HTML.`);
        } catch (error) {
            console.error('Error:', error);
            bot.sendMessage(chatId, 'Terjadi kesalahan saat mengubah tampilan HTML.');
        }
    }
});
