const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const token = '7077164519:AAHSCVQFKnTqziIYQoXf9ugLKlm7mM0grGA';
const bot = new TelegramBot(token, { polling: true });
const app = express();
const port = 3000;

let linkCounter = 0; // Untuk menyimpan nomor urutan terakhir link yang ditambahkan

app.use(bodyParser.json());

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route to handle adding a link
app.post('/addLink', (req, res) => {
    try {
        const { link } = req.body;
        linkCounter++; // Menambahkan nomor urutan
        const title = `Link ${linkCounter}`; // Menggunakan nomor urutan sebagai judul link
        let htmlContent = fs.readFileSync('public/index.html', 'utf8');
        const $ = cheerio.load(htmlContent);

        // Add title and link to HTML
        const linkHtml = `<h3>${title}</h3><a href="${link}">${link}</a><br>`;
        $('body').append(linkHtml);

        fs.writeFileSync('public/index.html', $.html());

        res.send(`Link ${title} telah ditambahkan ke tampilan HTML.`);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Terjadi kesalahan saat mengubah tampilan HTML.');
    }
});

// Start Express server
app.listen(port, () => {
    console.log(`Server sedang berjalan di http://localhost:${port}`);
});

// Handle Telegram bot commands
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = `Halo! Berikut adalah daftar perintah yang tersedia:\n\n`
                  + `/help - Melihat daftar perintah\n`
                  + `/addlink - Menambahkan link ke tampilan HTML`;
    bot.sendMessage(chatId, message);
});

// Variable to store links
let links = [];

// Handle Telegram bot messages
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const messageText = msg.text;

    // Check if message contains a URL
    if (msg.entities && msg.entities.some(entity => entity.type === 'url')) {
        const link = messageText;

        // Extract link title from message
        const spaceIndex = messageText.indexOf(' ');
        const linkTitle = messageText.slice(0, spaceIndex);
        const linkWithoutTitle = messageText.slice(spaceIndex + 1);

        // Add link to links array
        links.push({ title: linkTitle, link: linkWithoutTitle });

        // Send response to Telegram user
        bot.sendMessage(chatId, `Anda mengirimkan link: ${linkWithoutTitle}`);

        // Send POST request to Express server to add the link to HTML
        const axios = require('axios');
        axios.post('http://localhost:3000/addLink', { title: linkTitle, link: linkWithoutTitle })
            .then((response) => {
                console.log(response.data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

        // Show current links
        bot.sendMessage(chatId, `Daftar link saat ini:\n${getLinksList()}`);
    }

    // Check if message is /delete command
    if (messageText.startsWith('/delete')) {
        const commandParams = messageText.split(' ');

        // Check if command is /delete and has parameter
        if (commandParams.length === 2) {
            const linkId = parseInt(commandParams[1]);

            // Check if linkId is a valid index
            if (!isNaN(linkId) && linkId >= 1 && linkId <= links.length) {
                // Remove link from links array
                const deletedLink = links.splice(linkId - 1, 1)[0];

                // Send response to Telegram user
                bot.sendMessage(chatId, `Link dengan judul "${deletedLink.title}" telah dihapus.`);
            } else {
                bot.sendMessage(chatId, 'ID link tidak valid.');
            }
        } else {
            bot.sendMessage(chatId, 'Format perintah /delete tidak valid. Gunakan /delete <ID>.');
        }
    }
});

// Function to get list of links
function getLinksList() {
    let list = '';
    links.forEach((link, index) => {
        list += `${index + 1}. ${link.title}\n`;
    });
    return list;
}
