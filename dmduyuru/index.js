const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const { token, logFile, ownerID } = require('./config.json'); 

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const cooldowns = new Map();
let successLog = [];
let failLog = [];

client.once('ready', () => {
    console.log(`${client.user.tag} başarıyla giriş yaptı!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    
    if (message.author.id !== ownerID) {
        return message.reply('Bu botu yalnızca sahibi kullanabilir!');
    }

    
    if (message.content.startsWith('!dm')) {
        const args = message.content.split(' ').slice(1);
        const mention = message.mentions.users.first();
        const limit = parseInt(args.find(arg => !isNaN(arg)), 10);
        const dmMessage = args.filter(arg => isNaN(arg) && !arg.startsWith('<@')).join(' ');

        if (!dmMessage) {
            return message.reply('Göndermek istediğiniz mesajı yazmalısınız! Örnek: `!dm @Kullanıcı Merhaba!` veya `!dm 20 Merhaba!`');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];

        let count = 0;
        for (const [id, member] of members) {
            if (!member.user.bot) {
                if (mention && member.user.id !== mention.id) continue;
                if (limit && count >= limit) break;

                try {
                    await member.send(dmMessage);
                    successLog.push(member.user.tag);
                    count++;
                } catch {
                    failLog.push(member.user.tag);
                }
            }
        }

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;

        fs.appendFile(logFile, logMessage, (err) => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

    
    if (message.content.startsWith('!herkeseks')) {
        const args = message.content.split(' ').slice(1);
        const dmMessage = args.join(' ');

        if (!dmMessage) {
            return message.reply('Herkese göndermek istediğiniz mesajı yazmalısınız! Örnek: `!herkeseks Merhaba arkadaşlar!`');
        }

        const members = await message.guild.members.fetch();
        successLog = [];
        failLog = [];

        for (const [id, member] of members) {
            if (!member.user.bot) {
                try {
                    await member.send(dmMessage);
                    successLog.push(member.user.tag);
                } catch {
                    failLog.push(member.user.tag);
                }
            }
        }

        const logMessage = `\n=== ${new Date().toLocaleString()} ===\nBaşarılı:\n${successLog.join('\n')}\nBaşarısız:\n${failLog.join('\n')}\n`;

        fs.appendFile(logFile, logMessage, (err) => {
            if (err) console.error('Log dosyasına yazılamadı:', err);
        });

        message.channel.send(`Mesaj gönderimi tamamlandı!\nBaşarılı: ${successLog.length}\nBaşarısız: ${failLog.length}`);
    }

    // İstatistik Komutu
    if (message.content.startsWith('!istatistik')) {
        const istatistikMesajı = `**Mesaj İstatistikleri:**\n\n` +
            `🔹 Başarılı Gönderimler: ${successLog.length}\n` +
            `🔸 Başarısız Gönderimler: ${failLog.length}\n\n` +
            `**Başarısız Kullanıcılar:**\n${failLog.length > 0 ? failLog.join('\n') : 'Yok'}`;

        message.channel.send(istatistikMesajı);
    }

   
    if (message.content.startsWith('!setavatar')) {
        const args = message.content.split(' ').slice(1);
        const imageURL = args[0];

        if (!imageURL) {
            return message.reply('Profil resmi URL’sini belirtmelisiniz! Örnek: `!setavatar <URL>`');
        }

        try {
            await client.user.setAvatar(imageURL);
            message.channel.send('Profil resmi başarıyla değiştirildi!');
        } catch (err) {
            message.channel.send('Profil resmi değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

   
    if (message.content.startsWith('!setusername')) {
        const args = message.content.split(' ').slice(1);
        const newUsername = args.join(' ');

        if (!newUsername) {
            return message.reply('Yeni kullanıcı adını belirtmelisiniz! Örnek: `!setusername YeniKullanıcıAdı`');
        }

        try {
            await client.user.setUsername(newUsername);
            message.channel.send(`Kullanıcı adı başarıyla "${newUsername}" olarak değiştirildi!`);
        } catch (err) {
            message.channel.send('Kullanıcı adı değiştirilirken bir hata oluştu: ' + err.message);
        }
    }

    
    if (message.content.startsWith('!setstatus')) {
        const args = message.content.split(' ').slice(1);
        const statusType = args[0].toLowerCase();
        const statusMessage = args.slice(1).join(' ');

        if (!statusType || !statusMessage) {
            return message.reply('Durum türü ve mesajını belirtmelisiniz! Örnek: `!setstatus dnd Zypheris`');
        }

        let activity;
        switch (statusType) {
            case 'dnd':
                activity = { name: statusMessage, type: 3 };
                break;
            case 'idle':
                activity = { name: statusMessage, type: 1 };
                break;
            case 'playing':
                activity = { name: statusMessage, type: 0 };
                break;
            case 'streaming':
                activity = { name: statusMessage, type: 1, url: 'https://twitch.tv/ilwixi' };
                break;
            case 'listening':
                activity = { name: statusMessage, type: 2 };
                break;
            case 'watching':
                activity = { name: statusMessage, type: 3 };
                break;
            default:
                return message.reply('Geçersiz durum türü! Geçerli türler: `dnd`, `idle`, `playing`, `streaming`, `listening`, `watching`');
        }

        await client.user.setActivity(activity);
        message.channel.send(`Durum başarıyla "${statusType}" olarak değiştirildi: ${statusMessage}`);
    }

    
    if (message.content.startsWith('!yardım')) {
        const helpEmbed = {
            color: 0x0099ff,
            title: 'Bot Komutları',
            description: 'Bu botun kullanabileceğiniz komutlar:',
            fields: [
                {
                    name: '!dm',
                    value: 'Belirli bir kullanıcıya DM göndermenizi sağlar. Örnek: `!dm @Kullanıcı Merhaba!`',
                },
                {
                    name: '!herkeseks',
                    value: 'Herkese DM göndermenizi sağlar. Örnek: `!herkeseks Merhaba!`',
                },
                {
                    name: '!istatistik',
                    value: 'Mesaj gönderim istatistiklerinizi gösterir.',
                },
                {
                    name: '!setavatar',
                    value: 'Botun profil resmini değiştirir. Örnek: `!setavatar <URL>`',
                },
                {
                    name: '!setusername',
                    value: 'Botun kullanıcı adını değiştirir. Örnek: `!setusername YeniKullanıcıAdı`',
                },
                {
                    name: '!setstatus',
                    value: 'Botun durumunu değiştirir. Örnek: `!setstatus dnd Zypheris`',
                },
            ],
            footer: {
                text: 'Yararlı komutlar ve bot kontrolü için!',
            },
        };

        message.channel.send({ embeds: [helpEmbed] });
    }
});

client.login(token);
